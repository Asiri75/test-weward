import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useExploration } from '../state/useExploration';
import { CONFIG } from '../config';

export const TASK_NAME = 'fog-bg-location';

TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (error || !data) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  const ingest = useExploration.getState().ingestFix;
  locations.forEach((p) =>
    ingest({
      lat: p.coords.latitude,
      lng: p.coords.longitude,
      accuracy: p.coords.accuracy ?? 999,
      speed: p.coords.speed,
      ts: p.timestamp,
    })
  );
});

/** Starts background updates only if "Always" was granted; otherwise stays in degraded mode. */
export async function registerBackgroundLocation(): Promise<void> {
  const { status } = await Location.getBackgroundPermissionsAsync();
  if (status !== 'granted') return;
  const started = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (started) return;
  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: CONFIG.bgDistanceIntervalM,
    showsBackgroundLocationIndicator: false,
    foregroundService: {
      notificationTitle: 'Fog',
      notificationBody: 'Ta carte se révèle en marchant.',
    },
  });
}
