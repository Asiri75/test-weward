import * as Location from 'expo-location';

export async function requestWhenInUse(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

// iOS shows "Always" only as a second, separate prompt after When-In-Use.
// Wrapped: if background location isn't available on the platform/manifest,
// degrade gracefully instead of throwing.
export async function requestAlways(): Promise<boolean> {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export type PermissionState = 'always' | 'whenInUse' | 'denied';

export async function getPermissionState(): Promise<PermissionState> {
  const fg = await Location.getForegroundPermissionsAsync();
  if (fg.status !== 'granted') return 'denied';
  try {
    const bg = await Location.getBackgroundPermissionsAsync();
    return bg.status === 'granted' ? 'always' : 'whenInUse';
  } catch {
    return 'whenInUse'; // background unavailable -> degraded (foreground-only) mode
  }
}
