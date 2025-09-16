import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SettingsRow = ({ icon, label, right, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.rowLeft}>
      <Icon name={icon} size={18} color="#6B7280" style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <View>{right}</View>
  </TouchableOpacity>
);

const SettingsSection = ({ language, darkMode, onToggleDarkMode }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <SettingsRow
        icon="language"
        label="Language"
        right={<Text style={styles.muted}>English</Text>}
      />
      <SettingsRow
        icon="dark-mode"
        label="Dark Mode"
        right={<Switch value={darkMode} onValueChange={onToggleDarkMode} />}
      />
      <SettingsRow icon="notifications" label="Notifications" right={<Icon name="chevron-right" size={16} color="#9CA3AF" />} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 14,
    color: '#111827',
  },
  muted: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default SettingsSection;


