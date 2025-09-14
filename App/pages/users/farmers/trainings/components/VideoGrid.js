import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const VideoGrid = ({ videos, onVideoPress }) => {
  return (
    <View style={styles.container}>
      {videos.map((video) => (
        <TouchableOpacity
          key={video.id}
          style={styles.videoCard}
          onPress={() => onVideoPress(video)}
        >
          <View style={styles.thumbnailContainer}>
            <Image
              source={{ uri: video.thumbnail }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            
            <View style={styles.playOverlay}>
              <Icon name="play-arrow" size={16} color="white" />
            </View>
            
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{video.duration}</Text>
            </View>
          </View>
          
          <Text style={styles.title}>{video.title}</Text>
          
          <View style={styles.languageContainer}>
            <Icon name="language" size={12} color="#6B7280" />
            <Text style={styles.languageText}>{video.language}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  videoCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbnailContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  thumbnail: {
    width: '100%',
    height: 96,
    borderRadius: 6,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  languageText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default VideoGrid;
