import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const FeaturedVideo = ({ video, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(video)}>
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: video.thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        
        <View style={styles.playOverlay}>
          <TouchableOpacity style={styles.playButton}>
            <Icon name="play-arrow" size={24} color="#22c55e" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{video.duration}</Text>
        </View>
      </View>
      
      <Text style={styles.title}>{video.title}</Text>
      <Text style={styles.description}>{video.description}</Text>
      
      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <Icon name="visibility" size={12} color="#6B7280" />
          <Text style={styles.metaText}>{video.views} views</Text>
        </View>
        
        <View style={styles.metaItem}>
          <Icon name="language" size={12} color="#6B7280" />
          <Text style={styles.metaText}>{video.language}</Text>
        </View>
        
        <View style={styles.metaItem}>
          <Icon name="star" size={12} color="#FBBF24" />
          <Text style={styles.metaText}>{video.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbnailContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  thumbnail: {
    width: '100%',
    height: 160,
    borderRadius: 8,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  durationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default FeaturedVideo;
