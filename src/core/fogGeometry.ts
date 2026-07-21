import { cellsToMultiPolygon } from 'h3-js';
import { bboxPolygon, multiPolygon, difference, featureCollection } from '@turf/turf';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { HexId } from '../types';

/**
 * Fog = the viewport polygon MINUS the union of explored hexagons.
 * The holes let the bright map show through where the user has walked.
 * cellsToMultiPolygon requires a single resolution, so we pass the uniform
 * res-N cells directly (no compaction, which would mix resolutions).
 */
export function buildFog(
  hexes: HexId[],
  bbox: [number, number, number, number]
): Feature<Polygon | MultiPolygon> | null {
  const viewport = bboxPolygon(bbox);
  if (hexes.length === 0) return viewport as Feature<Polygon>;

  const loops = cellsToMultiPolygon(hexes, true); // GeoJSON [lng,lat], uniform resolution
  const explored = multiPolygon(loops as number[][][][]);

  // turf v7: difference takes a FeatureCollection, computes first minus rest.
  const fc = featureCollection<Polygon | MultiPolygon>([viewport, explored]);
  return difference(fc);
}
