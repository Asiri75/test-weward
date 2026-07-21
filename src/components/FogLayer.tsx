import React, { useMemo } from 'react';
import Mapbox from '@rnmapbox/maps';
import { buildFog } from '../core/fogGeometry';
import { COLORS } from '../theme';
import { HexId } from '../types';

/**
 * Renders the fog as a single Mapbox fill layer (viewport minus explored).
 * Geometry is memoized on [hexes, bbox] so it recomputes only when the
 * explored set or the visible region changes, never per frame.
 */
export function FogLayer({ hexes, bbox }: { hexes: HexId[]; bbox: [number, number, number, number] }) {
  const fog = useMemo(() => buildFog(hexes, bbox), [hexes, bbox]);
  if (!fog) return null;
  return (
    <Mapbox.ShapeSource id="fog-src" shape={fog as GeoJSON.Feature}>
      <Mapbox.FillLayer id="fog-fill" style={{ fillColor: COLORS.fog, fillOpacity: COLORS.fogOpacity }} />
    </Mapbox.ShapeSource>
  );
}
