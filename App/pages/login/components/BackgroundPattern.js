import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const BackgroundPattern = () => {
  return (
    <View style={styles.container}>
      {/* Decorative circles and shapes */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.square, styles.square1]} />
      <View style={[styles.circle, styles.circle3]} />
      <View style={[styles.circle, styles.circle4]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    zIndex: 0,
  },
  circle: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 50,
  },
  square: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#4CAF50',
    transform: [{ rotate: '45deg' }],
  },
  circle1: {
    top: height * 0.12,
    left: width * 0.2,
    width: 64,
    height: 64,
  },
  circle2: {
    top: height * 0.4,
    right: width * 0.3,
    width: 32,
    height: 32,
    backgroundColor: '#C8E6C9',
    borderWidth: 0,
  },
  square1: {
    bottom: height * 0.4,
    left: width * 0.4,
    width: 48,
    height: 48,
  },
  circle3: {
    bottom: height * 0.15,
    right: width * 0.2,
    width: 24,
    height: 24,
    backgroundColor: '#A5D6A7',
    borderWidth: 0,
  },
  circle4: {
    top: height * 0.5,
    left: width * 0.1,
    width: 40,
    height: 40,
  },
});

export default BackgroundPattern;
