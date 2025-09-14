import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaWrapper } from '../../../../components';
import BottomNavbar from '../components/bottom_navbar';

const TrainingScreen = ({ navigation }) => {
  const trainings = [
    {
      id: 1,
      title: 'Organic Farming Basics',
      duration: '2 hours',
      level: 'Beginner',
      progress: 100,
      status: 'Completed',
      description: 'Learn the fundamentals of organic farming practices',
    },
    {
      id: 2,
      title: 'Herb Cultivation Techniques',
      duration: '3 hours',
      level: 'Intermediate',
      progress: 75,
      status: 'In Progress',
      description: 'Advanced techniques for growing medicinal herbs',
    },
    {
      id: 3,
      title: 'Quality Control & Testing',
      duration: '1.5 hours',
      level: 'Advanced',
      progress: 0,
      status: 'Not Started',
      description: 'Learn how to test and maintain herb quality',
    },
    {
      id: 4,
      title: 'Market Trends & Pricing',
      duration: '2.5 hours',
      level: 'Intermediate',
      progress: 0,
      status: 'Not Started',
      description: 'Understand market dynamics and pricing strategies',
    },
  ];

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner':
        return '#22c55e';
      case 'Intermediate':
        return '#f59e0b';
      case 'Advanced':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return '#22c55e';
      case 'In Progress':
        return '#3b82f6';
      case 'Not Started':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const handleTrainingPress = (training) => {
    Alert.alert(
      training.title,
      `${training.description}\n\nDuration: ${training.duration}\nLevel: ${training.level}\nProgress: ${training.progress}%`
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaWrapper style={styles.safeArea} includeBottom={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Training</Text>
          <Text style={styles.headerSubtitle}>Enhance your farming skills</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Learning Progress</Text>
            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>1</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>1</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>2</Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
            </View>
          </View>

          <View style={styles.trainingsList}>
            <Text style={styles.sectionTitle}>Available Trainings</Text>
            {trainings.map((training) => (
              <TouchableOpacity
                key={training.id}
                style={styles.trainingCard}
                onPress={() => handleTrainingPress(training)}
              >
                <View style={styles.trainingHeader}>
                  <Text style={styles.trainingTitle}>{training.title}</Text>
                  <View style={[styles.levelBadge, { backgroundColor: getLevelColor(training.level) }]}>
                    <Text style={styles.levelText}>{training.level}</Text>
                  </View>
                </View>
                
                <Text style={styles.trainingDescription}>{training.description}</Text>
                
                <View style={styles.trainingFooter}>
                  <View style={styles.durationContainer}>
                    <Text style={styles.durationIcon}>⏱️</Text>
                    <Text style={styles.durationText}>{training.duration}</Text>
                  </View>
                  
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${training.progress}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{training.progress}%</Text>
                  </View>
                </View>
                
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(training.status) }]}>
                  <Text style={styles.statusText}>{training.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaWrapper>

      <BottomNavbar navigation={navigation} activeTab="training" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#DCFCE7',
  },
  scrollView: {
    flex: 1,
  },
  progressCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  trainingsList: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  trainingCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  trainingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  trainingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  trainingDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  trainingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
    minWidth: 30,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
});

export default TrainingScreen;
