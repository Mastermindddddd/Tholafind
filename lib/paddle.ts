import 'server-only';
import { Paddle, Environment } from '@paddle/paddle-node-sdk';

let cached: Paddle | null = null;

export function getPaddle(): Paddle {
  if (cached) return cached;

  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    throw new Error('PADDLE_API_KEY is not set.');
  }

  const environment =
    process.env.PADDLE_ENVIRONMENT === 'production' ? Environment.production : Environment.sandbox;

  cached = new Paddle(apiKey, { environment });
  return cached;
}