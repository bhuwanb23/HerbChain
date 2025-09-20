import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const Timeline = ({ timeline }) => {
  const getIconName = (iconType) => {
    switch (iconType) {
      case 'seedling':
        return 'leaf-outline';
      case 'microscope':
        return 'search-outline';
      case 'box':
        return 'cube-outline';
      default:
        return 'ellipse-outline';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>The Story of Your Herb</Text>
      <View style={styles.timelineContainer}>
        <View style={styles.timelineLine} />
        {timeline.map((item, index) => (
          <View key={item.id} style={styles.timelineItem}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={getIconName(item.icon)} 
                size={20} 
                color={COLORS.white} 
              />
            </View>
            <View style={styles.content}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDate}>{item.date}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 24,
  },
  timelineContainer: {
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 24,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.sageLight,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
    position: 'relative',
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.sage,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 12,
    color: COLORS.gray[500],
    lineHeight: 18,
  },
});

export default Timeline;
