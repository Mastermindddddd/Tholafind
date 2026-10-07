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

export type PhotoQuality = 'good' | 'fair' | 'poor';

/**
 * Everything we learn about ONE uploaded photo beyond its pixels.
 * Kept free of server-only imports so scoring code and types can be shared.
 */
export interface ImageSignals {
  url: string;
  /** True once the vision pass (tag text, material, cues) has run for this photo. */
  analyzed: boolean;

  // From the vision pass (see imageSignals.ts → analyzeImage)
  brand?: string;
  tagText: string[];
  modelCodes: string[];
  material?: string;
  color?: string;
  itemType?: string;
  designCues: string[];

  // From the upload step (see imageSignals.ts → prepareImage)
  quality: PhotoQuality;
  qualityIssues: string[];
  exif?: { make?: string; model?: string; takenAt?: string };
  /** Whether the original carried GPS data. Coordinates themselves are never stored. */
  hadLocation?: boolean;
}

/** All photos in a hunt merged into one view, used for scoring. */
export interface CombinedSignals {
  brand?: string;
  tagText: string[];
  modelCodes: string[];
  material?: string;
  color?: string;
  itemType?: string;
  designCues: string[];
  quality: PhotoQuality;
  qualityIssues: string[];
}

export type MissingAttribute = 'brand' | 'tag' | 'material' | 'color' | 'angle';

export interface MatchDiagnosis {
  explanation: string;
  missing: MissingAttribute[];
}