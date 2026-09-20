import { config } from 'dotenv';
config({ path: '.env' });

const BATCH_SIZE = 20; // parallel fetches per batch — keep polite to target sites and your own outbound bandwidth

async function main() {
  // Dynamic imports, not static ones: static imports are hoisted above the
  // config() call above by TS/esbuild's compilation, which would mean
  // lib/db.ts reads process.env.MONGODB_URI before dotenv has set it.
  // Dynamic import() runs exactly where it's written, so config() above is
  // guaranteed to run first.
  const { connectToDatabase } = await import('@/lib/db');
  const { SearchResult } = await import('@/lib/models');
  const { resolvePriceFromUrl } = await import('@/lib/search/priceResolver');

  await connectToDatabase();

  const missing = await SearchResult.find({
    $or: [{ price: { $exists: false } }, { price: '' }],
  }).select('_id url');

  console.log(`Found ${missing.length} results with no price.`);

  let resolved = 0;
  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const batch = missing.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (doc) => {
        try {
          const price = await resolvePriceFromUrl(doc.url);
          if (price) {
            await SearchResult.updateOne({ _id: doc._id }, { $set: { price } });
            resolved++;
          }
        } catch (err) {
          console.error(`Failed for ${doc.url}:`, err);
        }
      })
    );
    console.log(`Processed ${Math.min(i + BATCH_SIZE, missing.length)} / ${missing.length}`);
  }

  console.log(`Resolved ${resolved} / ${missing.length} prices.`);
  process.exit(0);
}

main();