import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const Header = ({ 
  title, 
  batchId, 
  status, 
  onBack, 
  onShare, 
  isSharing = false 
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[600]} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={onShare}
          disabled={isSharing}
        >
          <Ionicons 
            name="share-outline" 
            size={24} 
            color={isSharing ? COLORS.gray[400] : COLORS.gray[600]} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.titleSection}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.batchId}>Batch ID: {batchId}</Text>
        <View style={styles.statusBadge}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.sage} />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    padding: 8,
  },
  titleSection: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  batchId: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.sageLight}20`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.sage,
    marginLeft: 8,
  },
});

export default Header;
