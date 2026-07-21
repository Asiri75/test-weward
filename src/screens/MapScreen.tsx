import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { useExploration } from '../state/useExploration';
import { FogLayer } from '../components/FogLayer';
import { DeviceLocationSource, createSimulatedSource, LocationSource } from '../services/locationSource';
import { WALK_ROUTE, DRIVE_ROUTE } from '../services/routes';
import { POIS } from '../services/pois';
import { requestAlways, getPermissionState } from '../services/permissions';
import { registerBackgroundLocation } from '../services/backgroundTask';
import { LocationFix } from '../types';
import { COLORS } from '../theme';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

const HOME: [number, number] = [2.3522, 48.8566];

export default function MapScreen() {
  const { exploredHexes, ingestFix, hydrate, syncNow } = useExploration();
  const [bbox, setBbox] = useState<[number, number, number, number]>([2.3, 48.84, 2.4, 48.87]);
  const [degraded, setDegraded] = useState(false);
  const stopRef = useRef<null | (() => void)>(null);
  const askedAlways = useRef(false);

  useEffect(() => {
    hydrate();
    void syncNow();
    getPermissionState().then((s) => setDegraded(s === 'whenInUse'));
    return () => stopRef.current?.();
  }, []);

  const onFix = async (fix: LocationFix) => {
    const before = useExploration.getState().exploredHexes.length;
    ingestFix(fix);
    const after = useExploration.getState().exploredHexes.length;
    // On the first real reveal, ask for "Always" (iOS second step), then start background.
    if (!askedAlways.current && after > before) {
      askedAlways.current = true;
      const granted = await requestAlways();
      setDegraded(!granted);
      if (granted) await registerBackgroundLocation();
    }
  };

  const run = async (src: LocationSource) => {
    stopRef.current?.();
    stopRef.current = await src.start(onFix);
  };

  return (
    <View style={{ flex: 1 }}>
      <Mapbox.MapView
        style={{ flex: 1 }}
        styleURL={Mapbox.StyleURL.Light}
        onCameraChanged={(state: any) => {
          const b = state?.properties?.bounds;
          if (b?.ne && b?.sw) setBbox([b.sw[0], b.sw[1], b.ne[0], b.ne[1]]);
        }}
      >
        <Mapbox.Camera zoomLevel={15} centerCoordinate={HOME} followUserLocation />
        <Mapbox.UserLocation visible />
        <FogLayer hexes={exploredHexes} bbox={bbox} />
        {POIS.map((p) => (
          <Mapbox.PointAnnotation key={p.id} id={p.id} coordinate={[p.lng, p.lat]}>
            <View style={[styles.poi, { backgroundColor: COLORS.orange }]} />
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>

      {degraded && (
        <View style={styles.banner}>
          <Text style={styles.bannerT}>Mode réduit: révélation seulement app ouverte.</Text>
        </View>
      )}

      <View style={styles.hud}>
        <Text style={styles.hudT}>{exploredHexes.length} hexagones explorés</Text>
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.btn} onPress={() => run(DeviceLocationSource)}>
          <Text style={styles.btnT}>Réel</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => run(createSimulatedSource(WALK_ROUTE))}>
          <Text style={styles.btnT}>Simuler marche</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => run(createSimulatedSource(DRIVE_ROUTE))}>
          <Text style={styles.btnT}>Simuler voiture</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  poi: { width: 18, height: 24, borderRadius: 4, borderWidth: 2, borderColor: 'white' },
  banner: { position: 'absolute', top: 54, alignSelf: 'center', backgroundColor: COLORS.navy, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  bannerT: { color: 'white', fontSize: 12 },
  hud: { position: 'absolute', top: 100, alignSelf: 'center', backgroundColor: COLORS.emerald, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  hudT: { color: 'white', fontWeight: '700' },
  controls: { position: 'absolute', bottom: 30, flexDirection: 'row', alignSelf: 'center', gap: 8 },
  btn: { backgroundColor: COLORS.navy, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  btnT: { color: 'white', fontWeight: '600' },
});
