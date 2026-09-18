// scripts/backfill-collection-item-type.ts
import { connectToDatabase } from '@/lib/db';
import { CollectionItem } from '@/lib/models';

async function main() {
  await connectToDatabase();
  const result = await CollectionItem.updateMany(
    { searchResultId: { $exists: true }, itemType: { $exists: false } },
    [{ $set: { itemType: 'SearchResult', itemId: '$searchResultId' } }]
  );
  console.log(`Backfilled ${result.modifiedCount} documents.`);
  process.exit(0);
}

main();