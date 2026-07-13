/**
 * Tiny weather card for the farmer home — pulls coords from FarmProfile
 * (or device) and shows current conditions + advisory.
 */
import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { FarmProfileAPI, WeatherAPI } from '../../../../services/apiClient';

export default function WeatherCard({ onPress }) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [provider, setProvider] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let lat = null;
        let lng = null;
        try {
          const farm = await FarmProfileAPI.getMine(accessToken);
          if (farm?.farm?.gps_lat != null && farm?.farm?.gps_lng != null) {
            lat = farm.farm.gps_lat;
            lng = farm.farm.gps_lng;
          }
        } catch (_e) {
          // ignore
        }
        if (lat == null || lng == null) {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const pos = await Location.getCurrentPositionAsync({});
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
            }
          } catch (_e) {
            // ignore
          }
        }
        if (lat == null || lng == null) {
          if (!cancelled) {
            setErrorMsg('Set GPS in your farm profile to see weather.');
            setLoading(false);
          }
          return;
        }
        const data = await WeatherAPI.get(accessToken, lat, lng);
        if (!cancelled) {
          setWeather(data.weather);
          setProvider(data.provider);
        }
      } catch (err) {
        if (!cancelled) setErrorMsg(err?.message || 'Could not load weather');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.title}>Weather</Text>
      {loading ? (
        <ActivityIndicator color="#10B981" />
      ) : errorMsg ? (
        <Text style={styles.muted}>{errorMsg}</Text>
      ) : weather ? (
        <View>
          <Text style={styles.temp}>{weather.current?.temp_c}°C</Text>
          <Text style={styles.cond}>
            {weather.current?.condition} · humidity {weather.current?.humidity}%
          </Text>
          <Text style={styles.advisory} numberOfLines={2}>
            {weather.advisory}
          </Text>
          <Text style={styles.meta}>source: {provider}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ECFEFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A5F3FC',
  },
  title: { color: '#075985', fontWeight: '700', marginBottom: 6 },
  temp: { color: '#075985', fontWeight: '700', fontSize: 28 },
  cond: { color: '#0E7490', marginTop: 2 },
  advisory: { color: '#155E75', marginTop: 6, fontSize: 12 },
  meta: { color: '#64748B', marginTop: 4, fontSize: 10 },
  muted: { color: '#64748B', fontSize: 12 },
});
