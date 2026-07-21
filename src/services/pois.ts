export type PoiKind = 'wecard' | 'chest';

export interface Poi {
  id: string;
  lat: number;
  lng: number;
  kind: PoiKind;
}

export const POIS: Poi[] = [
  { id: '1', lat: 48.857, lng: 2.353, kind: 'wecard' },
  { id: '2', lat: 48.856, lng: 2.354, kind: 'chest' },
];
