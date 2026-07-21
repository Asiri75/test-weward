import * as Location from 'expo-location';

export async function requestWhenInUse(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

// iOS shows "Always" only as a second, separate prompt after When-In-Use.
export async function requestAlways(): Promise<boolean> {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  return status === 'granted';
}

export type PermissionState = 'always' | 'whenInUse' | 'denied';

export async function getPermissionState(): Promise<PermissionState> {
  const fg = await Location.getForegroundPermissionsAsync();
  if (fg.status !== 'granted') return 'denied';
  const bg = await Location.getBackgroundPermissionsAsync();
  return bg.status === 'granted' ? 'always' : 'whenInUse';
}
