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
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 16,
  },
  content: {
    alignItems: 'center',
  },
  imageContainer: {
    marginBottom: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#DCFCE7',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 10,
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
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#DCFCE7',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default HeroSection;
