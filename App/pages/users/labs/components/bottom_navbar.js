import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BottomNavbar = ({ navigation, activeTab = 'dashboard' }) => {
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for active tab
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleTabPress = (tabId) => {
    if (navigation && navigation.navigate) {
      navigation.navigate(tabId);
    }
  };

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      iconName: 'view-dashboard-outline',
    },
    {
      id: 'batches',
      label: 'Batches',
      iconName: 'package-variant',
    },
    {
      id: 'testing',
      label: 'Testing',
      iconName: 'test-tube',
    },
    {
      id: 'reports',
      label: 'Reports',
      iconName: 'chart-line',
    },
    {
      id: 'profile',
      label: 'Profile',
      iconName: 'cog',
    },
  ];

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['#006B38', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tab}
                onPress={() => handleTabPress(tab.id)}
                activeOpacity={0.7}
              >
                <Animated.View style={[
                  styles.tabContent,
                  isActive && {
                    transform: [{ scale: pulseAnim }],
                  }
                ]}>
                  <Animated.View style={[
                    styles.iconContainer,
                    isActive && styles.activeIconContainer,
                    {
                      opacity: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: isActive ? [0.95, 1] : [0.8, 0.9],
                      })
                    }
                  ]}>
                    <Icon
                      name={tab.iconName}
                      size={20}
                      color={isActive ? '#064E3B' : '#FFFFFF'}
                    />
                  </Animated.View>
                </Animated.View>
                
                {isActive && (
                  <Animated.View style={[
                    styles.activeIndicator,
                    {
                      opacity: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      })
                    }
                  ]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#F8F9FA', // Background color to prevent color bleeding
  },
  container: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    shadowColor: '#006B38',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  activeIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(6, 78, 59, 0.15)',
    shadowColor: 'rgba(6, 78, 59, 0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 1.5,
    shadowColor: 'rgba(6, 78, 59, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default BottomNavbar;
