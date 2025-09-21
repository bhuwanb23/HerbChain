import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useGlobalTranslation } from '../../../../language/GlobalTranslationContext';

const { width } = Dimensions.get('window');

const ConsumerHome = ({ navigation, onNavigate }) => {
  const { t } = useGlobalTranslation();

  const quickActions = [
    {
      id: 'scan',
      title: t.consumer?.scanQRCode || 'Scan QR Code',
      subtitle: t.consumer?.verifyHerbAuthenticity || 'Verify herb authenticity',
      icon: 'qr-code',
      color: COLORS.sage,
      onPress: () => onNavigate('scan')
    },
    {
      id: 'trace',
      title: t.consumer?.traceProduct || 'Trace Product',
      subtitle: t.consumer?.trackHerbJourney || 'Track herb journey',
      icon: 'search',
      color: COLORS.sageLight,
      onPress: () => onNavigate('traceability')
    },
    {
      id: 'history',
      title: t.consumer?.viewHistory || 'View History',
      subtitle: t.consumer?.seePastScans || 'See past scans',
      icon: 'time',
      color: COLORS.earthBrown,
      onPress: () => onNavigate('history')
    }
  ];

  const recentActivity = [
    {
      id: 1,
      herbName: 'Ashwagandha',
      batchId: 'HERB-ASH-001',
      date: '2 hours ago',
      status: 'Verified',
      icon: 'checkmark-circle'
    },
    {
      id: 2,
      herbName: 'Turmeric',
      batchId: 'HERB-TUR-003',
      date: '1 day ago',
      status: 'Verified',
      icon: 'checkmark-circle'
    },
    {
      id: 3,
      herbName: 'Ginger',
      batchId: 'HERB-GIN-002',
      date: '3 days ago',
      status: 'Verified',
      icon: 'checkmark-circle'
    }
  ];

  const stats = [
    {
      id: 1,
      title: t.consumer?.herbsScanned || 'Herbs Scanned',
      value: '24',
      icon: 'leaf',
      color: COLORS.sage
    },
    {
      id: 2,
      title: t.consumer?.verifiedProducts || 'Verified Products',
      value: '22',
      icon: 'shield-checkmark',
      color: COLORS.sageLight
    },
    {
      id: 3,
      title: t.consumer?.thisMonth || 'This Month',
      value: '8',
      icon: 'calendar',
      color: COLORS.earthBrown
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>{t.consumer?.welcomeBack || 'Welcome back!'}</Text>
          <Text style={styles.subtitleText}>{t.consumer?.verifyAuthenticity || 'Verify the authenticity of your herbs'}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => onNavigate('profile')}>
          <Ionicons name="person-circle" size={40} color={COLORS.sage} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {stats.map((stat) => (
          <View key={stat.id} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
              <Ionicons name={stat.icon} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.consumer?.quickActions || 'Quick Actions'}</Text>
        <View style={styles.actionsContainer}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={action.onPress}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                <Ionicons name={action.icon} size={28} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.consumer?.recentActivity || 'Recent Activity'}</Text>
          <TouchableOpacity onPress={() => onNavigate('history')}>
            <Text style={styles.viewAllText}>{t.consumer?.viewAll || 'View All'}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.activityContainer}>
          {recentActivity.map((item) => (
            <TouchableOpacity key={item.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name={item.icon} size={20} color={COLORS.sage} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityHerbName}>{item.herbName}</Text>
                <Text style={styles.activityBatchId}>Batch: {item.batchId}</Text>
              </View>
              <View style={styles.activityMeta}>
                <Text style={styles.activityStatus}>{item.status}</Text>
                <Text style={styles.activityDate}>{item.date}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tips Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.consumer?.tipsForHerbVerification || 'Tips for Herb Verification'}</Text>
        <View style={styles.tipCard}>
          <Ionicons name="bulb" size={24} color={COLORS.sage} />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>{t.consumer?.alwaysScanBeforeUse || 'Always scan before use'}</Text>
            <Text style={styles.tipText}>
              {t.consumer?.verifyAuthenticityTip || 'Verify the authenticity and quality of your herbs by scanning the QR code on the packaging.'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: COLORS.white,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: COLORS.gray[500],
  },
  profileButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.sage,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
    flex: 1,
  },
  actionSubtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
    flex: 1,
  },
  activityContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.sage}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHerbName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  activityBatchId: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  activityMeta: {
    alignItems: 'flex-end',
  },
  activityStatus: {
    fontSize: 12,
    color: COLORS.sage,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  tipCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipContent: {
    flex: 1,
    marginLeft: 16,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.gray[500],
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default ConsumerHome;
