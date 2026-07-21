import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../theme';

const CARD = require('../../assets/weward-card.jpg');
const DOT_COUNT = 14;
const PALETTE = [COLORS.emerald, COLORS.orange, '#ffffff', '#FFD166'];

/** One particle that bursts outward from the card and fades (the "points"). */
function Dot({ index }: { index: number }) {
  const p = useSharedValue(0);
  const cfg = useMemo(() => {
    const angle = (index / DOT_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    return {
      angle,
      dist: 100 + Math.random() * 70,
      size: 6 + Math.random() * 7,
      color: PALETTE[index % PALETTE.length],
      delay: Math.random() * 120,
    };
  }, [index]);

  useEffect(() => {
    p.value = withDelay(120 + cfg.delay, withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.cos(cfg.angle) * cfg.dist * p.value },
      { translateY: Math.sin(cfg.angle) * cfg.dist * p.value },
      { scale: 1 - p.value * 0.6 },
    ],
    opacity: 1 - p.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { width: cfg.size, height: cfg.size, borderRadius: cfg.size / 2, backgroundColor: cfg.color },
        style,
      ]}
    />
  );
}

/** Full-screen card-collection reveal: card springs + flips in, particles burst. */
export function CardReveal({ onClose }: { onClose: () => void }) {
  const scale = useSharedValue(0);
  const rot = useSharedValue(-0.35);
  const backdrop = useSharedValue(0);
  const textO = useSharedValue(0);
  const textY = useSharedValue(18);

  useEffect(() => {
    backdrop.value = withTiming(1, { duration: 220 });
    scale.value = withSpring(1, { damping: 9, stiffness: 130 });
    rot.value = withSpring(0, { damping: 8, stiffness: 90 });
    textO.value = withDelay(260, withTiming(1, { duration: 320 }));
    textY.value = withDelay(260, withSpring(0, { damping: 12 }));
  }, []);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { scale: scale.value }, { rotateY: `${rot.value}rad` }],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textO.value, transform: [{ translateY: textY.value }] }));

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />
      <View style={styles.center}>
        <View style={styles.burst}>
          {Array.from({ length: DOT_COUNT }).map((_, i) => (
            <Dot key={i} index={i} />
          ))}
        </View>
        <Animated.View style={cardStyle}>
          <Image source={CARD} style={styles.card} />
        </Animated.View>
        <Animated.View style={[styles.caption, textStyle]}>
          <Text style={styles.title}>Carte collectée !</Text>
          <Text style={styles.wards}>+50 Wards</Text>
          <Text style={styles.hint}>Touche pour fermer</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(6,10,20,0.82)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  burst: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute' },
  card: { width: 150, height: 250, borderRadius: 16 },
  caption: { marginTop: 30, alignItems: 'center' },
  title: { color: 'white', fontSize: 24, fontWeight: '800' },
  wards: { color: COLORS.emerald, fontSize: 18, fontWeight: '700', marginTop: 4 },
  hint: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 16 },
});
