import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SummaryCard = ({ title, value, change, changeType, icon, bgColor, iconColor }) => {
  const changeTextStyle = changeType === 'increase' ? styles.increaseText : styles.decreaseText;
  const changeIcon = changeType === 'increase' ? 'arrow-upward' : 'arrow-downward';

  return (
    <View style={styles.cardContainer}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
        <View style={styles.changeContainer}>
          <Icon name={changeIcon} size={12} color={changeType === 'increase' ? '#16a34a' : '#dc2626'} />
          <Text style={changeTextStyle}>{change}</Text>
        </View>
      </View>
      <View style={[styles.iconWrapper, { backgroundColor: bgColor }]}>
        <Icon name={icon} size={24} color={iconColor} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.41,
    elevation: 2,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  increaseText: {
    fontSize: 12,
    color: '#16a34a', // green-600
    marginLeft: 4,
  },
  decreaseText: {
    fontSize: 12,
    color: '#dc2626', // red-600
    marginLeft: 4,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SummaryCard;