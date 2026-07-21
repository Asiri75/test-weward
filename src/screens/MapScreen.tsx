import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
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
const CARD = require('../../assets/weward-card.jpg');

export default function MapScreen() {
  const { exploredHexes, ingestFix, hydrate, syncNow, reset } = useExploration();
  const [bbox, setBbox] = useState<[number, number, number, number]>([2.3, 48.84, 2.4, 48.87]);
  const [degraded, setDegraded] = useState(false);
  const [simPos, setSimPos] = useState<[number, number] | null>(null);
  const stopRef = useRef<null | (() => void)>(null);
  const cameraRef = useRef<any>(null);
  const askedAlways = useRef(false);

  useEffect(() => {
    hydrate();
    void syncNow();
    getPermissionState().then((s) => setDegraded(s === 'whenInUse'));
    return () => stopRef.current?.();
  }, []);

  const onFix = async (fix: LocationFix) => {
    // Move the visible marker + follow with the camera so the walk is visible.
    setSimPos([fix.lng, fix.lat]);
    cameraRef.current?.setCamera({
      centerCoordinate: [fix.lng, fix.lat],
      zoomLevel: 16,
      animationDuration: 500,
    });

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

  const runReal = async () => {
    setSimPos(null); // hand back to the real device location
    await run(DeviceLocationSource);
  };

  const doReset = () => {
    stopRef.current?.(); // stop any running simulation
    stopRef.current = null;
    setSimPos(null);
    reset();
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
        <Mapbox.Camera ref={cameraRef} defaultSettings={{ centerCoordinate: HOME, zoomLevel: 15 }} />
        <Mapbox.UserLocation visible={!simPos} />
        <FogLayer hexes={exploredHexes} bbox={bbox} />

        {POIS.map((p) => (
          <Mapbox.MarkerView key={p.id} id={`poi-${p.id}`} coordinate={[p.lng, p.lat]}>
            <Image source={CARD} style={styles.card} />
          </Mapbox.MarkerView>
        ))}

        {simPos && (
          <Mapbox.MarkerView id="simpos" coordinate={simPos}>
            <View style={styles.simOuter}>
              <View style={styles.simInner} />
            </View>
          </Mapbox.MarkerView>
        )}
      </Mapbox.MapView>

      {degraded && (
        <View style={styles.banner}>
          <Text style={styles.bannerT}>Mode réduit: révélation seulement app ouverte.</Text>
        </View>
      )}

      <View style={styles.hud}>
        <Text style={styles.hudT}>{exploredHexes.length} hexagones explorés</Text>
      </View>

      <Pressable style={styles.reset} onPress={doReset}>
        <Text style={styles.resetT}>Réinitialiser</Text>
      </Pressable>

      <View style={styles.controls}>
        <Pressable style={styles.btn} onPress={runReal}>
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
  card: { width: 30, height: 50, borderRadius: 4 },
  simOuter: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(30,136,229,0.3)', alignItems: 'center', justifyContent: 'center' },
  simInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.user, borderWidth: 2, borderColor: 'white' },
  banner: { position: 'absolute', top: 54, alignSelf: 'center', backgroundColor: COLORS.navy, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  bannerT: { color: 'white', fontSize: 12 },
  hud: { position: 'absolute', top: 100, alignSelf: 'center', backgroundColor: COLORS.emerald, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  hudT: { color: 'white', fontWeight: '700' },
  reset: { position: 'absolute', top: 150, right: 14, backgroundColor: 'rgba(18,26,46,0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  resetT: { color: 'white', fontWeight: '600', fontSize: 12 },
  controls: { position: 'absolute', bottom: 30, flexDirection: 'row', alignSelf: 'center', gap: 8 },
  btn: { backgroundColor: COLORS.navy, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  btnT: { color: 'white', fontWeight: '600' },
});
