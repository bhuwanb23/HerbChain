import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveDevApiBaseUrl() {
  try {
    const hostUri =
      Constants?.expoConfig?.hostUri ||
      Constants?.manifest2?.extra?.expoClient?.hostUri ||
      Constants?.manifest?.debuggerHost || '';

    // hostUri examples: '192.168.1.5:19000', 'localhost:19000'
    const host = hostUri.split(':')[0];

    // Android emulator cannot reach localhost; use 10.0.2.2
    if (Platform.OS === 'android') {
      // If running on emulator and host is localhost, map to 10.0.2.2 (Django on 8000)
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://10.0.2.2:8000';
      }
    }

    // iOS simulator can use localhost, but prefer LAN IP if available
    const ipOrLocal = host && host !== 'undefined' ? host : 'localhost';
    return `http://${ipOrLocal}:8000`;
  } catch {
    return 'http://localhost:8000';
  }
}

export const API_BASE_URL = resolveDevApiBaseUrl();

