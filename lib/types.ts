export type SourceKind = 'retail' | 'resale' | 'vintage';

export type Confidence = 'exact' | 'close' | 'guess';

export interface FindResult {
  id: string;
  itemType: 'SearchResult' | 'DiscoveryItem';
  title: string;
  source: string;
  sourceKind: SourceKind;
  price: string;
  confidence: Confidence;
  image: string;
  url: string;
  aspect: number;
  saved: boolean;
}