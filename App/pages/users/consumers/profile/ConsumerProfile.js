import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useGlobalTranslation } from '../../../../language/GlobalTranslationContext';

const ConsumerProfile = ({ navigation, onNavigate }) => {
  const { t } = useGlobalTranslation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  const userStats = {
    totalScans: 24,
    verifiedProducts: 22,
    favoriteHerbs: 8,
    joinDate: 'October 2024'
  };

  const menuSections = [
    {
      title: t.consumer?.account || 'Account',
      items: [
        {
          id: 'personal-info',
          title: t.consumer?.personalInformation || 'Personal Information',
          subtitle: t.consumer?.updateProfileDetails || 'Update your profile details',
          icon: 'person',
          onPress: () => Alert.alert(t.consumer?.comingSoon || 'Coming Soon', t.consumer?.personalInfoEditingSoon || 'Personal information editing will be available soon.')
        },
        {
          id: 'preferences',
          title: t.consumer?.preferences || 'Preferences',
          subtitle: t.consumer?.customizeExperience || 'Customize your experience',
          icon: 'settings',
          onPress: () => Alert.alert(t.consumer?.comingSoon || 'Coming Soon', t.consumer?.preferencesSoon || 'Preferences will be available soon.')
        }
      ]
    },
    {
      title: t.consumer?.security || 'Security',
      items: [
        {
          id: 'privacy',
          title: t.consumer?.privacySettings || 'Privacy Settings',
          subtitle: t.consumer?.controlDataPrivacy || 'Control your data privacy',
          icon: 'shield-checkmark',
          onPress: () => Alert.alert(t.consumer?.comingSoon || 'Coming Soon', t.consumer?.privacySettingsSoon || 'Privacy settings will be available soon.')
        },
        {
          id: 'security',
          title: t.consumer?.security || 'Security',
          subtitle: t.consumer?.passwordAuthentication || 'Password and authentication',
          icon: 'lock-closed',
          onPress: () => Alert.alert(t.consumer?.comingSoon || 'Coming Soon', t.consumer?.securitySettingsSoon || 'Security settings will be available soon.')
        }
      ]
    },
    {
      title: t.consumer?.support || 'Support',
      items: [
        {
          id: 'help',
          title: t.consumer?.helpSupport || 'Help & Support',
          subtitle: t.consumer?.getHelpContactSupport || 'Get help and contact support',
          icon: 'help-circle',
          onPress: () => Alert.alert(t.consumer?.helpSupport || 'Help & Support', t.consumer?.contactSupport || 'Contact us at support@herbchain.com')
        },
        {
          id: 'feedback',
          title: t.consumer?.sendFeedback || 'Send Feedback',
          subtitle: t.consumer?.helpImproveApp || 'Help us improve the app',
          icon: 'chatbubble',
          onPress: () => Alert.alert(t.consumer?.sendFeedback || 'Feedback', t.consumer?.feedbackThankYou || 'Thank you for your interest in providing feedback!')
        },
        {
          id: 'about',
          title: t.consumer?.aboutHerbChain || 'About HerbChain',
          subtitle: t.consumer?.learnMoreMission || 'Learn more about our mission',
          icon: 'information-circle',
          onPress: () => Alert.alert(t.consumer?.aboutHerbChain || 'About HerbChain', t.consumer?.aboutHerbChainDescription || 'HerbChain ensures authenticity and traceability of herbal products through blockchain technology.')
        }
      ]
    }
  ];

  const handleLogout = () => {
    Alert.alert(
      t.consumer?.logout || 'Logout',
      t.consumer?.logoutConfirm || 'Are you sure you want to logout?',
      [
        { text: t.consumer?.cancel || 'Cancel', style: 'cancel' },
        { 
          text: t.consumer?.logout || 'Logout', 
          style: 'destructive',
          onPress: () => {
            // Handle logout logic here
            Alert.alert(t.consumer?.logout || 'Logged Out', t.consumer?.loggedOut || 'You have been successfully logged out.');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color={COLORS.white} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>John Doe</Text>
            <Text style={styles.userEmail}>john.doe@example.com</Text>
            <Text style={styles.memberSince}>{t.consumer?.memberSince || 'Member since'} {userStats.joinDate}</Text>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userStats.totalScans}</Text>
          <Text style={styles.statLabel}>{t.consumer?.totalScans || 'Total Scans'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userStats.verifiedProducts}</Text>
          <Text style={styles.statLabel}>{t.consumer?.verified || 'Verified'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userStats.favoriteHerbs}</Text>
          <Text style={styles.statLabel}>{t.consumer?.favorites || 'Favorites'}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => onNavigate('history')}
        >
          <Ionicons name="time" size={20} color={COLORS.sage} />
          <Text style={styles.quickActionText}>{t.consumer?.viewHistory || 'View History'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => onNavigate('scan')}
        >
          <Ionicons name="qr-code" size={20} color={COLORS.sage} />
          <Text style={styles.quickActionText}>{t.consumer?.scanQR || 'Scan QR'}</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Sections */}
      <View style={styles.settingsContainer}>
        {/* App Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>{t.consumer?.appSettings || 'App Settings'}</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={24} color={COLORS.gray[600]} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{t.consumer?.pushNotifications || 'Push Notifications'}</Text>
                <Text style={styles.settingSubtitle}>{t.consumer?.getNotifiedScanResults || 'Get notified about scan results'}</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.gray[300], true: `${COLORS.sage}50` }}
              thumbColor={notificationsEnabled ? COLORS.sage : COLORS.gray[500]}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="scan" size={24} color={COLORS.gray[600]} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{t.consumer?.autoScanMode || 'Auto-Scan Mode'}</Text>
                <Text style={styles.settingSubtitle}>{t.consumer?.automaticallyScan || 'Automatically scan when camera opens'}</Text>
              </View>
            </View>
            <Switch
              value={autoScanEnabled}
              onValueChange={setAutoScanEnabled}
              trackColor={{ false: COLORS.gray[300], true: `${COLORS.sage}50` }}
              thumbColor={autoScanEnabled ? COLORS.sage : COLORS.gray[500]}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="finger-print" size={24} color={COLORS.gray[600]} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{t.consumer?.biometricLogin || 'Biometric Login'}</Text>
                <Text style={styles.settingSubtitle}>{t.consumer?.useFingerprintFaceID || 'Use fingerprint or face ID'}</Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: COLORS.gray[300], true: `${COLORS.sage}50` }}
              thumbColor={biometricEnabled ? COLORS.sage : COLORS.gray[500]}
            />
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  itemIndex === section.items.length - 1 && styles.lastMenuItem
                ]}
                onPress={item.onPress}
              >
                <View style={styles.menuItemContent}>
                  <View style={styles.menuItemIcon}>
                    <Ionicons name={item.icon} size={24} color={COLORS.gray[600]} />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#EF4444" />
            <Text style={styles.logoutText}>{t.consumer?.logout || 'Logout'}</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>{t.consumer?.appVersion || 'HerbChain v1.0.0'}</Text>
          <Text style={styles.versionSubtext}>{t.consumer?.copyright || '© 2024 HerbChain. All rights reserved.'}</Text>
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
    backgroundColor: COLORS.sage,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.white}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: `${COLORS.white}90`,
    marginBottom: 2,
  },
  memberSince: {
    fontSize: 14,
    color: `${COLORS.white}70`,
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
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.sage,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.sage,
  },
  settingsContainer: {
    paddingHorizontal: 20,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  menuItem: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  lastMenuItem: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  logoutContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  versionText: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: COLORS.gray[400],
  },
  bottomSpacer: {
    height: 100,
  },
});

export default ConsumerProfile;
