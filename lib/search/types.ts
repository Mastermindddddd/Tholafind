import { SourceKind } from '@/lib/types';

/** A single candidate item returned by one provider, before scoring/normalization. */
export interface RawCandidate {
  title: string;
  image?: string;
  price?: string;
  url: string;
  source: string;
  sourceKind: SourceKind;
  metadata?: Record<string, unknown>;
}