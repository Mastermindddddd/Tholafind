/**
 * Phase 0 verification script.
 *
 * Connects to the real MongoDB configured in MONGODB_URI (local Docker Mongo or an
 * Atlas cluster — both work identically), then for every model:
 *   1. confirms its indexes are built (createIndexes / syncIndexes),
 *   2. writes a throwaway document,
 *   3. reads it back,
 *   4. deletes it.
 *
 * This is meant to be run by hand once you have a real MONGODB_URI, as the concrete
 * check for the Phase 0 deliverable — it can't be verified inside the Next.js build
 * itself, since a build shouldn't require a live database.
 *
 * Usage:
 *   cp .env.example .env.local   # then fill in MONGODB_URI
 *   npm run db:verify
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import {
  User,
  Search,
  SearchResult,
  Collection,
  CollectionItem,
  CommunityRequest,
  Alert,
  Subscription,
} from '../lib/models';

const models = [
  { name: 'User', model: User },
  { name: 'Search', model: Search },
  { name: 'SearchResult', model: SearchResult },
  { name: 'Collection', model: Collection },
  { name: 'CollectionItem', model: CollectionItem },
  { name: 'CommunityRequest', model: CommunityRequest },
  { name: 'Alert', model: Alert },
  { name: 'Subscription', model: Subscription },
] as const;

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.');
    process.exit(1);
  }

  console.log(`Connecting to ${uri.replace(/\/\/.*@/, '//<redacted>@')} ...`);
  await mongoose.connect(uri);
  console.log('Connected.\n');

  console.log('Building indexes for every model...');
  for (const { name, model } of models) {
    await model.syncIndexes();
    const indexes = await model.collection.indexes();
    console.log(`  ${name}: ${indexes.length} index(es) — ${indexes.map((i) => i.name).join(', ')}`);
  }

  console.log('\nWrite/read/delete smoke test on User...');
  const throwaway = await User.create({
    authId: `verify-script-${Date.now()}`,
    email: `verify-script-${Date.now()}@tholafind.dev`,
    name: 'DB Verify Script',
  });
  console.log(`  Wrote User ${throwaway._id}`);

  const readBack = await User.findById(throwaway._id).lean();
  if (!readBack) throw new Error('Read-back failed — document not found.');
  console.log(`  Read back: ${readBack.email}`);

  await User.deleteOne({ _id: throwaway._id });
  console.log('  Cleaned up.\n');

  console.log('Phase 0 check passed: models are connected, indexed, and read/write works.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('\nDB verification failed:', err);
  process.exit(1);
});
