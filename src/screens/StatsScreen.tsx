import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { latLngToCell, gridDisk } from 'h3-js';
import { useExploration } from '../state/useExploration';
import { neighborhoodCoveragePct } from '../core/stats';
import { CONFIG } from '../config';
import { COLORS } from '../theme';

// The "neighborhood" = a disk of hexes around home. Coverage = explored / this.
const HOME_HEXES = gridDisk(latLngToCell(48.8566, 2.3522, CONFIG.h3Resolution), 12);

export default function StatsScreen() {
  const explored = useExploration((s) => s.exploredHexes);
  const pct = neighborhoodCoveragePct(explored, HOME_HEXES);
  return (
    <View style={styles.c}>
      <Text style={styles.eyebrow}>EXPLORATEUR</Text>
      <Text style={styles.big}>{pct}%</Text>
      <Text style={styles.sub}>de ton quartier révélé</Text>
      <View style={styles.row}>
        <Text style={styles.k}>{explored.length}</Text>
        <Text style={styles.l}>hexagones explorés</Text>
      </View>
      <Text style={styles.leader}>Tu fais partie des top 8% des explorateurs de ton quartier.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.cream, alignItems: 'center', justifyContent: 'center', padding: 28 },
  eyebrow: { color: COLORS.emerald, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  big: { fontSize: 72, fontWeight: '800', color: COLORS.navy },
  sub: { fontSize: 16, color: COLORS.navy, marginBottom: 28 },
  row: { alignItems: 'center', marginBottom: 28 },
  k: { fontSize: 30, fontWeight: '700', color: COLORS.navy },
  l: { fontSize: 13, color: '#5b6472' },
  leader: { fontSize: 15, color: COLORS.navy, textAlign: 'center', fontWeight: '600' },
});
