import * as Sentry from '@sentry/react-native';

export function initMonitoring() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
  Sentry.init({ dsn, enabled: !!dsn });
}
