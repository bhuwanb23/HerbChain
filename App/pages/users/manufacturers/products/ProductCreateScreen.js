/**
 * Product Create — create a new product master + optional formula lines.
 *
 * Backend: POST /api/v1/products          { name, sku?, category, pack_size?, description? }
 *          POST /api/v1/products/:id/formulas  { species_code, standard_quantity, unit }
 */
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { ProductsAPI } from '../../../../services/apiClient';

const CATEGORIES = ['capsule', 'powder', 'tea', 'oil', 'tincture', 'tablet', 'cream', 'other'];

export default function ProductCreateScreen({ navigation }) {
  const { accessToken } = useAuth();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('other');
  const [packSize, setPackSize] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Product name is required.');
      return;
    }
    setCreating(true);
    try {
      await ProductsAPI.create(accessToken, {
        name: name.trim(),
        sku: sku.trim() || undefined,
        category,
        pack_size: packSize.trim() || undefined,
        description: description.trim() || undefined,
      });
      Alert.alert('Created', `${name} has been created.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Failed', err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Product</Text>

      <Text style={styles.label}>Product Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Tulsi Wellness Tea"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.label}>SKU (optional)</Text>
      <TextInput
        style={styles.input}
        value={sku}
        onChangeText={setSku}
        placeholder="TWT-001"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.catRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.catChip, category === c && styles.catChipActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.catText, category === c && styles.catTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Pack Size (optional)</Text>
      <TextInput
        style={styles.input}
        value={packSize}
        onChangeText={setPackSize}
        placeholder="e.g. 100g, 500ml"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="Product description..."
        placeholderTextColor="#9CA3AF"
      />

      <TouchableOpacity
        style={[styles.primary, creating && { opacity: 0.7 }]}
        onPress={handleCreate}
        disabled={creating}
      >
        {creating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Create Product</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.cancel}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 8, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 12 },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    padding: 12, marginTop: 6, color: '#111827', fontSize: 14,
  },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E5E7EB' },
  catChipActive: { backgroundColor: '#F97316' },
  catText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  catTextActive: { color: '#FFF' },
  primary: { backgroundColor: '#F97316', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  primaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  cancel: { textAlign: 'center', color: '#6B7280', marginTop: 14, fontSize: 14 },
});
