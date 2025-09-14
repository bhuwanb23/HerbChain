import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const HeroSection = ({ stats }) => {
  return (
    <LinearGradient
      colors={['#22c55e', '#16a34a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/f35d6d5c20-0f239786319aacf38249.png'
            }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
        
        <Text style={styles.title}>Learn & Earn</Text>
        <Text style={styles.subtitle}>
          Enhance your farming skills and increase your income through our training programs
        </Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalVideos}+</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.languages}</Text>
            <Text style={styles.statLabel}>Languages</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.support}</Text>
            <Text style={styles.statLabel}>Support</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 24,
  },
  content: {
    alignItems: 'center',
  },
  imageContainer: {
    marginBottom: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#DCFCE7',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#DCFCE7',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default HeroSection;
