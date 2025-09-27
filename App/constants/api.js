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

    // For Android, prefer the host IP reported by Expo (a LAN IP) so the emulator
    // or a physical device can reach the dev server. Only fall back to the special
    // emulator address 10.0.2.2 when the detected host is 'localhost' or '127.0.0.1'.
    if (Platform.OS === 'android') {
      const hostLower = String(host || '').toLowerCase();
      if (hostLower === 'localhost' || hostLower === '127.0.0.1' || hostLower === '') {
        return 'http://10.0.2.2:8000';
      }
      return `http://${hostLower}:8000`;
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

