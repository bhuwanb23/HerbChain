import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  PerfectIntro,
  LoginHeader,
  LanguageButton,
  LoginInput,
  RoleCard,
  LoginButton,
  SafeAreaWrapper,
  BottomSpacer,
} from '../../components';

const { width } = Dimensions.get('window');

const PerfectLoginScreen = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState('English');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const roles = [
    { id: 'farmer', name: 'Farmer', icon: '🌱', color: '#4CAF50' },
    { id: 'transporter', name: 'Transporter', icon: '🚚', color: '#FF9800' },
    { id: 'lab', name: 'Lab', icon: '🔬', color: '#2196F3' },
    { id: 'ayush', name: 'AYUSH/Admin', icon: '🏛️', color: '#9C27B0' },
    { id: 'consumer', name: 'Consumer', icon: '👥', color: '#607D8B' },
  ];

  const languages = ['English', 'Hindi', 'Regional'];

  useEffect(() => {
    if (!showIntro) {
      // Start login screen animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showIntro]);

  const handleLogin = () => {
    if (!email || !password || !selectedRole) {
      Alert.alert('Error', 'Please fill in all fields and select a role');
      return;
    }
    Alert.alert('Success', `Login successful as ${selectedRole}`);
  };

  const handleSignUp = () => {
    Alert.alert('Sign Up', 'Navigate to sign up screen');
  };

  const handleLanguageChange = () => {
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  if (showIntro) {
    return <PerfectIntro onAnimationComplete={handleIntroComplete} />;
  }

  return (
    <SafeAreaWrapper style={styles.container} includeBottom={true}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Header */}
          <LoginHeader />

          {/* Language Switcher */}
          <View style={styles.languageContainer}>
            <LanguageButton language={language} onPress={handleLanguageChange} />
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            
            {/* Email Input */}
            <LoginInput
              icon="📧"
              placeholder="Email or Mobile Number"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            {/* Password Input */}
            <LoginInput
              icon="🔒"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              showPassword={showPassword}
              onEyePress={() => setShowPassword(!showPassword)}
            />

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Role Selection */}
            <Text style={styles.roleTitle}>Select Your Role</Text>
            <View style={styles.roleContainer}>
              {roles.map((role, index) => (
                <Animated.View
                  key={role.id}
                  style={[
                    styles.roleButtonWrapper,
                    {
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 50],
                            outputRange: [0, 50 + index * 15],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <RoleCard
                    role={role}
                    isSelected={selectedRole === role.id}
                    onPress={() => setSelectedRole(role.id)}
                  />
                </Animated.View>
              ))}
            </View>

            {/* Login Button */}
            <LoginButton title="Login" onPress={handleLogin} variant="primary" />

            {/* Sign Up Option */}
            <LoginButton title="Don't have an account? Sign Up" onPress={handleSignUp} variant="secondary" />
          </View>

          {/* Onboarding Text */}
          <View style={styles.onboardingContainer}>
            <Text style={styles.onboardingText}>
              New here? Join HerbChain to grow with trust.
            </Text>
          </View>

          {/* Bottom Spacer for Navigation Bar */}
          <BottomSpacer extraPadding={20} />
        </Animated.View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  languageContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  formContainer: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  formTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
    marginTop: -5,
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: '600',
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 25,
    textAlign: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  roleButtonWrapper: {
    width: '48%',
    marginBottom: 18,
  },
  onboardingContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 20,
  },
  onboardingText: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
  },
});

export default PerfectLoginScreen;
