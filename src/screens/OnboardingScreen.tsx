import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { requestWhenInUse } from '../services/permissions';
import { COLORS } from '../theme';

const SLIDES = [
  'Ta marche révèle la carte.',
  'Ce que tu n’as jamais exploré reste dans le brouillard.',
  'On révèle seulement quand tu marches. Jamais en voiture.',
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  return (
    <View style={styles.c}>
      <Text style={styles.h}>{SLIDES[i]}</Text>
      <Pressable
        style={styles.btn}
        onPress={async () => {
          if (!last) {
            setI(i + 1);
            return;
          }
          await requestWhenInUse();
          onDone();
        }}
      >
        <Text style={styles.btnT}>{last ? 'Activer la localisation' : 'Suivant'}</Text>
      </Pressable>
      <View style={styles.dots}>
        {SLIDES.map((_, k) => (
          <View key={k} style={[styles.dot, k === i && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center', padding: 28 },
  h: { color: 'white', fontSize: 26, textAlign: 'center', marginBottom: 40, lineHeight: 34 },
  btn: { backgroundColor: COLORS.emerald, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  btnT: { color: 'white', fontWeight: '700', fontSize: 16 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 28 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: COLORS.emerald },
});
