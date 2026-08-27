import { notFound } from 'next/navigation';
import { Types } from 'mongoose';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AnswerForm from '@/components/AnswerForm';
import MarkHelpfulButton from '@/components/MarkHelpfulButton';
import { connectToDatabase } from '@/lib/db';
import { CommunityRequest, Search, User } from '@/lib/models';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { CheckCircle2, ExternalLink } from 'lucide-react';

// Explicit, not relying on getOrCreateUser's implicit dynamic trigger —
// same reasoning as app/community/page.tsx.
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function CommunityRequestDetailPage({ params }: PageProps) {
  const { id } = params;

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectToDatabase();

  const communityRequest = await CommunityRequest.findById(id).lean();
  if (!communityRequest) {
    notFound();
  }

  const search = await Search.findById(communityRequest.searchId).lean();
  if (!search) {
    notFound();
  }

  const viewer = await getOrCreateUser();
  const isRequester = Boolean(viewer && String(communityRequest.requestedBy) === String(viewer._id));

  const answererIds = communityRequest.answers.map((a) => a.userId);
  const answerers = await User.find({ _id: { $in: answererIds } })
    .select('name helpfulAnswerCount')
    .lean();
  const answererById = new Map(answerers.map((u) => [String(u._id), u]));

  // Most recent answer first.
  const sortedAnswers = [...communityRequest.answers].reverse();

  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />

      <section className="mx-auto max-w-3xl px-5 pt-10 sm:px-8">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-brick">
          Hunt log &middot; #{search.reference}
        </p>

        <div className="mt-4 flex gap-4">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-md border border-line shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={search.images[0]} alt="The item being asked about" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              {search.hint || 'Help identify this find'}
            </h1>
            <p className="mt-1.5 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-inkSoft">
              {communityRequest.status === 'resolved' ? 'Resolved' : 'Open'} &middot;{' '}
              {formatRelativeTime(communityRequest.createdAt)}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <h2 className="font-display text-lg font-semibold text-ink">
          {sortedAnswers.length} {sortedAnswers.length === 1 ? 'answer' : 'answers'}
        </h2>

        <div className="mt-4 space-y-3">
          {sortedAnswers.map((answer) => {
            const answerer = answererById.get(String(answer.userId));
            return (
              <div
                key={String(answer._id)}
                className={`rounded-md border p-4 ${
                  answer.markedHelpful ? 'border-brass bg-card' : 'border-line bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[0.72rem] text-ink">
                        {answerer?.name || 'A finder'}
                      </span>
                      {(answerer?.helpfulAnswerCount ?? 0) > 0 && (
                        <span className="font-mono text-[0.6rem] uppercase tracking-[0.06em] text-inkSoft">
                          {answerer!.helpfulAnswerCount} helpful{' '}
                          {answerer!.helpfulAnswerCount === 1 ? 'answer' : 'answers'}
                        </span>
                      )}
                      {answer.markedHelpful && (
                        <span className="flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-[0.06em] text-brass">
                          <CheckCircle2 size={11} /> Marked helpful
                        </span>
                      )}
                    </div>
                    {answer.note && (
                      <p className="mt-1.5 text-[0.88rem] text-ink">{answer.note}</p>
                    )}
                    <a
                      href={answer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-brick hover:underline"
                    >
                      View link <ExternalLink size={11} />
                    </a>
                  </div>

                  {isRequester && !answer.markedHelpful && (
                    <MarkHelpfulButton requestId={String(communityRequest._id)} answerId={String(answer._id)} />
                  )}
                </div>
              </div>
            );
          })}

          {sortedAnswers.length === 0 && (
            <p className="text-[0.88rem] text-inkSoft">
              No answers yet &mdash; be the first to take a look.
            </p>
          )}
        </div>

        {!isRequester && (
          <div className="mt-6">
            <AnswerForm requestId={String(communityRequest._id)} />
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}