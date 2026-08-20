export type SourceKind = 'retail' | 'resale' | 'vintage';

export type Confidence = 'exact' | 'close' | 'guess';

export interface FindResult {
  id: string;
  title: string;
  source: string;
  sourceKind: SourceKind;
  price: string;
  confidence: Confidence;
  image: string;
  aspect: number; // height / width, for masonry variety
}

export interface Collection {
  id: string;
  name: string;
  itemCount: number;
  cover: string;
  updated: string;
}
