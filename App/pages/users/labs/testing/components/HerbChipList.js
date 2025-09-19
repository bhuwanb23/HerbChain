import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const HerbChipList = ({ title, items, onPress }) => {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.wrap}> 
        {items.map((h) => (
          <TouchableOpacity key={h.batch_id} onPress={() => onPress(h)} style={styles.badge}>
            <Text style={styles.badgeText}>{h.batch_id}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { color: '#374151', fontWeight: '700' },
});

export default HerbChipList;


