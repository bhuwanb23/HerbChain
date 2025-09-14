import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
// import LinearGradient from 'react-native-linear-gradient';

const AIRecognition = ({ isProcessing, aiDetection, onCameraPress }) => {
  const renderCameraButton = () => {
    if (isProcessing) {
      return (
        <View style={styles.cameraButton}>
          <Icon name="refresh" size={32} color="white" style={styles.spinningIcon} />
          <Text style={styles.buttonTitle}>Processing...</Text>
          <Text style={styles.buttonSubtitle}>AI is analyzing the image</Text>
        </View>
      );
    }

    if (aiDetection) {
      return (
        <View style={[styles.cameraButton, styles.successGradient]}>
          <Icon name="check-circle" size={32} color="white" />
          <Text style={styles.buttonTitle}>{aiDetection.species} Detected!</Text>
          <Text style={styles.buttonSubtitle}>Confidence: {aiDetection.confidence}%</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.cameraButton}
        onPress={onCameraPress}
        activeOpacity={0.8}
      >
        <View style={[styles.gradientButton, styles.cameraGradient]}>
          <Icon name="camera-alt" size={32} color="white" />
          <Text style={styles.buttonTitle}>Take Photo</Text>
          <Text style={styles.buttonSubtitle}>AI will identify the herb automatically</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Icon name="smart-toy" size={20} color="#16a34a" />
        <Text style={styles.sectionTitle}>AI Recognition</Text>
      </View>

      <View style={styles.cameraSection}>
        {renderCameraButton()}
      </View>

      {aiDetection && (
        <View style={styles.autoFillSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="location-on" size={16} color="#2563eb" />
              <Text style={styles.infoTitle}>Auto-detected Location</Text>
            </View>
            <Text style={styles.infoText}>
              {aiDetection.location}, Coordinates: {aiDetection.coordinates}
            </Text>
          </View>

          <View style={[styles.infoCard, styles.purpleCard]}>
            <View style={styles.infoHeader}>
              <Icon name="access-time" size={16} color="#9333ea" />
              <Text style={[styles.infoTitle, styles.purpleText]}>Timestamp</Text>
            </View>
            <Text style={[styles.infoText, styles.purpleText]}>
              {aiDetection.timestamp}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  cameraSection: {
    marginBottom: 24,
  },
  cameraButton: {
    borderRadius: 16,
    padding: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#86efac',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientButton: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  cameraGradient: {
    backgroundColor: '#22c55e',
  },
  successGradient: {
    backgroundColor: '#10b981',
  },
  spinningIcon: {
    transform: [{ rotate: '360deg' }],
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 12,
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  autoFillSection: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  purpleCard: {
    backgroundColor: '#faf5ff',
    borderColor: '#e9d5ff',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e40af',
    marginLeft: 8,
  },
  purpleText: {
    color: '#7c3aed',
  },
  infoText: {
    fontSize: 14,
    color: '#1d4ed8',
  },
});

export default AIRecognition;
