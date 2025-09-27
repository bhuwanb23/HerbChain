import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveDevApiBaseUrl() {
  try {
    const hostUri =
      Constants?.expoConfig?.hostUri ||
      Constants?.manifest2?.extra?.expoClient?.hostUri ||
      Constants?.manifest?.debuggerHost || '';

    // hostUri examples: '192.168.1.5:19000', 'localhost:19000'
    let host = hostUri.split(':')[0];

    // If no host was available from Expo constants, default to localhost
    if (!host || host === 'undefined') {
      host = 'localhost';
    }

    // Android emulator cannot reach host machine's localhost or LAN IP directly.
    // For development builds running in the Android emulator, always map to 10.0.2.2
    // which forwards to the host machine. If you run on a physical device, ensure
    // API_BASE_URL resolves to the host IP (e.g., http://192.168.x.x:8000).
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';
    }

    // iOS simulator can use localhost, but prefer LAN IP if available
    // Prefer Django dev server on port 8000 for local development
    const ipOrLocal = host;
    return `http://${ipOrLocal}:8000`;
  } catch {
    return 'http://localhost:8000';
  }
}

export const API_BASE_URL = resolveDevApiBaseUrl();

