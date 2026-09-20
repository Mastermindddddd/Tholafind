// scripts/check-price-resolution-rate.ts
import { config } from 'dotenv';
config({ path: '.env' });

async function main() {
  const { connectToDatabase } = await import('@/lib/db');
  const { SearchResult } = await import('@/lib/models');

  const conn = await connectToDatabase();
  console.log(`Connected to database: ${conn.connection.name}`);
  console.log(`Connection host: ${conn.connection.host}`);

  const total = await SearchResult.countDocuments({});
  const missing = await SearchResult.countDocuments({
    $or: [{ price: { $exists: false } }, { price: '' }],
  });

  console.log(`\nTotal SearchResult documents: ${total}`);
  console.log(`Missing price: ${missing}`);
  console.log(`Has price: ${total - missing}\n`);

  const bySource = await SearchResult.aggregate([
    {
      $group: {
        _id: '$source',
        total: { $sum: 1 },
        missing: {
          $sum: {
            $cond: [
              { $or: [{ $eq: [{ $type: '$price' }, 'missing'] }, { $eq: ['$price', ''] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    { $match: { missing: { $gt: 0 } } }, // only show sources that actually have gaps
    { $sort: { missing: -1 } },
  ]);

  console.log('Sources with missing prices:');
  for (const row of bySource) {
    console.log(`${row._id}: ${row.missing} missing / ${row.total} total`);
  }
  if (bySource.length === 0) {
    console.log('(none — every source has 100% price coverage)');
  }

  process.exit(0);
}

main();