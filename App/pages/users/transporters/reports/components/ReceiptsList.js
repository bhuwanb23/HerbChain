import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Item = ({ id, date, route, amount }) => (
  <View style={styles.item}>
    <View style={styles.left}>
      <View style={styles.avatar}> 
        <Icon name="receipt" size={18} color="#2563EB" />
      </View>
      <View>
        <Text style={styles.id}>#{id}</Text>
        <Text style={styles.meta}>{date} • {route}</Text>
      </View>
    </View>
    <View style={styles.right}>
      <Text style={styles.amount}>${amount.toFixed(2)}</Text>
      <TouchableOpacity activeOpacity={0.7}><Text style={styles.link}>Download</Text></TouchableOpacity>
    </View>
  </View>
);

const ReceiptsList = ({ items }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Recent Trip Receipts</Text>
        <Text style={styles.link}>View All</Text>
      </View>
      <View style={styles.list}>
        {items.map((r) => (
          <Item key={r.id} {...r} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  header: { fontSize: 12, fontWeight: '700', color: '#111827' },
  link: { fontSize: 12, color: '#2563EB', fontWeight: '700' },
  list: { gap: 12 },
  item: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(37,99,235,0.1)', alignItems: 'center', justifyContent: 'center' },
  id: { fontSize: 13, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 11, color: '#6B7280' },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 13, fontWeight: '700', color: '#111827' },
});

export default ReceiptsList;


