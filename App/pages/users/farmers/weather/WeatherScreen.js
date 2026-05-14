/**
 * Weather screen — current + 3-day forecast for the farmer's farm location.
 */
import React, { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { FarmProfileAPI, WeatherAPI } from '../../../../services/apiClient';

export default function WeatherScreen({ navigation }) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [provider, setProvider] = useState('');
  const [origin, setOrigin] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let lat = null;
      let lng = null;
      let source = 'device';
      try {
        const farm = await FarmProfileAPI.getMine(accessToken);
        if (farm?.farm?.gps_lat != null && farm?.farm?.gps_lng != null) {
          lat = farm.farm.gps_lat;
          lng = farm.farm.gps_lng;
          source = 'farm_profile';
        }
      } catch (_e) {
        // ignore
      }
      if (lat == null || lng == null) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Location permission denied');
        const pos = await Location.getCurrentPositionAsync({});
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        source = 'device';
      }
      setOrigin({ lat, lng, source });
      const data = await WeatherAPI.get(accessToken, lat, lng);
      setWeather(data.weather);
      setProvider(data.provider);
    } catch (err) {
      Alert.alert('Could not load weather', err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.back}>
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Local Weather</Text>
      {origin && (
        <Text style={styles.subtitle}>
          {origin.lat.toFixed(2)}, {origin.lng.toFixed(2)} · source: {origin.source}
        </Text>
      )}

      {loading ? (
        <ActivityIndicator color="#10B981" />
      ) : !weather ? (
        <Text style={styles.muted}>No data.</Text>
      ) : (
        <View>
          <View style={styles.heroCard}>
            <Text style={styles.heroTemp}>{weather.current?.temp_c}°C</Text>
            <Text style={styles.heroCond}>{weather.current?.condition}</Text>
            <View style={styles.statRow}>
              <Text style={styles.stat}>Humidity {weather.current?.humidity}%</Text>
              <Text style={styles.stat}>Wind {weather.current?.wind_kmh} km/h</Text>
            </View>
            <Text style={styles.advisory}>{weather.advisory}</Text>
          </View>

          <Text style={styles.section}>Next days</Text>
          {(weather.forecast || []).map((d) => (
            <View key={d.date} style={styles.dayCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayDate}>{d.date}</Text>
                <Text style={styles.dayCond}>{d.condition}</Text>
              </View>
              <Text style={styles.dayTemp}>
                {Math.round(d.min ?? 0)}° / {Math.round(d.max ?? 0)}°
              </Text>
              <Text style={styles.dayMeta}>Hum {d.humidity}%</Text>
            </View>
          ))}
          <Text style={styles.providerNote}>Data from: {provider}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  back: { marginBottom: 4 },
  backText: { color: '#10B981', fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700', color: '#0E7490', marginTop: 6 },
  subtitle: { color: '#6B7280', marginBottom: 16, fontSize: 12 },
  heroCard: { backgroundColor: '#ECFEFF', borderRadius: 14, padding: 18, borderColor: '#A5F3FC', borderWidth: 1 },
  heroTemp: { color: '#075985', fontWeight: '700', fontSize: 48 },
  heroCond: { color: '#0E7490', fontSize: 18, marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  stat: { color: '#0F172A', fontSize: 13 },
  advisory: { color: '#155E75', marginTop: 14, fontWeight: '600' },
  section: { fontWeight: '700', color: '#075985', marginTop: 18, marginBottom: 8 },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    gap: 8,
  },
  dayDate: { fontWeight: '700', color: '#111827' },
  dayCond: { color: '#6B7280', fontSize: 12 },
  dayTemp: { fontWeight: '700', color: '#0E7490' },
  dayMeta: { color: '#6B7280', fontSize: 12 },
  providerNote: { color: '#9CA3AF', marginTop: 12, fontSize: 11, textAlign: 'center' },
  muted: { color: '#6B7280' },
});
