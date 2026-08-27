import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { connectToDatabase } from '@/lib/db';
import { CommunityRequest, User } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params }: { params: { id: string; answerId: string } }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Sign in first.' }, { status: 401 });
  }

  if (!Types.ObjectId.isValid(params.id) || !Types.ObjectId.isValid(params.answerId)) {
    return NextResponse.json({ ok: false, message: 'Invalid ID.' }, { status: 400 });
  }

  await connectToDatabase();

  const communityRequest = await CommunityRequest.findById(params.id);
  if (!communityRequest) {
    return NextResponse.json({ ok: false, message: 'Request not found.' }, { status: 404 });
  }

  // Only the person who asked gets to decide which answer actually helped —
  // otherwise reputation could be gamed by anyone marking any answer.
  if (String(communityRequest.requestedBy) !== String(user._id)) {
    return NextResponse.json(
      { ok: false, message: 'Only the person who asked can mark an answer as helpful.' },
      { status: 403 }
    );
  }

  const answer = communityRequest.answers.id(params.answerId);
  if (!answer) {
    return NextResponse.json({ ok: false, message: 'Answer not found.' }, { status: 404 });
  }

  // Idempotent guard: re-clicking an already-marked answer shouldn't
  // double-increment the responder's reputation count.
  if (!answer.markedHelpful) {
    answer.markedHelpful = true;
    communityRequest.status = 'resolved';
    await communityRequest.save();
    await User.updateOne({ _id: answer.userId }, { $inc: { helpfulAnswerCount: 1 } });
  }

  return NextResponse.json({ ok: true });
}