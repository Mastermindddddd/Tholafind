import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // Thrown lazily (on first connect attempt), not at import time, so `next build`
  // never needs a real database to succeed.
  console.warn(
    '[db] MONGODB_URI is not set. Set it in .env.local before calling connectToDatabase().'
  );
}

/**
 * Next.js reloads route modules in dev, which would otherwise open a new Mongoose
 * connection on every request. We cache the connection (and the in-flight connect
 * promise) on the global object so it survives hot reloads and is reused across
 * serverless invocations in production.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not set. Add it to .env.local (see .env.example) — a local ' +
        '"mongodb://localhost:27017/tholafind" or an Atlas connection string both work.'
    );
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((m) => m);
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    // Reset the promise on failure so the next request retries the connection
    // instead of replaying a rejected promise forever.
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}
