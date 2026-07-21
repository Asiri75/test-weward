import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getPermissionState, requestAlways, PermissionState } from '../services/permissions';
import { registerBackgroundLocation } from '../services/backgroundTask';
import { COLORS } from '../theme';

const LABEL: Record<PermissionState, string> = {
  always: 'Toujours (arrière-plan actif)',
  whenInUse: "Pendant l'utilisation (mode réduit)",
  denied: 'Refusée',
};

export default function SettingsScreen() {
  const [perm, setPerm] = useState<PermissionState>('denied');
  const [notif, setNotif] = useState(false);

  useEffect(() => {
    getPermissionState().then(setPerm);
  }, []);

  const enableAlways = async () => {
    const granted = await requestAlways();
    if (granted) await registerBackgroundLocation();
    setPerm(await getPermissionState());
  };

  const enableNotif = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotif(status === 'granted');
  };

  return (
    <View style={styles.c}>
      <Text style={styles.title}>Réglages</Text>

      <View style={styles.card}>
        <Text style={styles.k}>Localisation</Text>
        <Text style={styles.v}>{LABEL[perm]}</Text>
        {perm !== 'always' && (
          <Pressable style={styles.btn} onPress={enableAlways}>
            <Text style={styles.btnT}>Activer l'arrière-plan</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.k}>Alertes POI à proximité</Text>
        <Text style={styles.v}>{notif ? 'Activées' : 'Désactivées'}</Text>
        {!notif && (
          <Pressable style={styles.btn} onPress={enableNotif}>
            <Text style={styles.btnT}>Activer les alertes</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.cream, padding: 20, paddingTop: 70 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.navy, marginBottom: 20 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 14 },
  k: { fontSize: 16, fontWeight: '700', color: COLORS.navy },
  v: { fontSize: 14, color: '#5b6472', marginTop: 4, marginBottom: 10 },
  btn: { backgroundColor: COLORS.emerald, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  btnT: { color: 'white', fontWeight: '700' },
});
