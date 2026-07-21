import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import MapScreen from './src/screens/MapScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { getPermissionState } from './src/services/permissions';
import { initMonitoring } from './src/services/monitoring';
import { COLORS } from './src/theme';
import './src/services/backgroundTask'; // defines the background task at module load

initMonitoring();
const qc = new QueryClient();

type Tab = 'map' | 'stats' | 'settings';
const TAB_LABEL: Record<Tab, string> = { map: 'Carte', stats: 'Explorateur', settings: 'Réglages' };

export default function App() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab] = useState<Tab>('map');

  useEffect(() => {
    getPermissionState().then((s) => {
      setOnboarded(s !== 'denied');
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!onboarded) return <OnboardingScreen onDone={() => setOnboarded(true)} />;

  return (
    <QueryClientProvider client={qc}>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {tab === 'map' && <MapScreen />}
          {tab === 'stats' && <StatsScreen />}
          {tab === 'settings' && <SettingsScreen />}
        </View>
        <View style={styles.tabs}>
          {(['map', 'stats', 'settings'] as Tab[]).map((t) => (
            <Pressable key={t} style={styles.tab} onPress={() => setTab(t)}>
              <Text style={[styles.tabT, tab === t && styles.tabActive]}>{TAB_LABEL[t]}</Text>
            </Pressable>
          ))}
        </View>
        <StatusBar style="light" />
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.navy },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.navy, paddingBottom: 24, paddingTop: 10 },
  tab: { flex: 1, alignItems: 'center' },
  tabT: { color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: 13 },
  tabActive: { color: COLORS.emerald },
});
