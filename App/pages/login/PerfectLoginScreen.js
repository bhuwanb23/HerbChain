import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import {
  PerfectIntro,
  SafeAreaWrapper,
  BottomSpacer,
} from '../../components';
import {
  BackgroundPattern,
  LanguageSwitcher,
  LogoSection,
  LoginForm,
  RoleSelection,
  SignUpSection,
  FooterLinks,
} from './components';

const { width } = Dimensions.get('window');

const PerfectLoginScreen = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [selectedRole, setSelectedRole] = useState('');
  const [language, setLanguage] = useState('EN');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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

  const handleLogin = (credentials) => {
    if (!credentials.email || !credentials.password || !selectedRole) {
      Alert.alert('Error', 'Please fill in all fields and select a role');
      return;
    }
    Alert.alert('Success', `Login successful as ${selectedRole}`);
  };

  const handleSignUp = () => {
    Alert.alert('Sign Up', 'Navigate to sign up screen');
  };

  const handleLanguageChange = (selectedLang) => {
    setLanguage(selectedLang.code);
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Navigate to forgot password screen');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Navigate to privacy policy');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'Navigate to terms of service');
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  if (showIntro) {
    return <PerfectIntro onAnimationComplete={handleIntroComplete} />;
  }

  return (
    <SafeAreaWrapper style={styles.container} includeBottom={true}>
      {/* Background Pattern */}
      <BackgroundPattern />
      
      {/* Language Switcher */}
      <LanguageSwitcher onLanguageChange={handleLanguageChange} />

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
          {/* Logo Section */}
          <LogoSection />

          {/* Login Form */}
          <LoginForm 
            onLogin={handleLogin}
            onForgotPassword={handleForgotPassword}
          />

          {/* Role Selection */}
          <RoleSelection 
            onRoleSelect={setSelectedRole}
            selectedRole={selectedRole}
          />

          {/* Sign Up Section */}
          <SignUpSection onSignUp={handleSignUp} />

          {/* Footer Links */}
          <FooterLinks 
            onPrivacyPolicy={handlePrivacyPolicy}
            onTermsOfService={handleTermsOfService}
          />

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
    backgroundColor: '#F0FDF4', // Light green background like HTML
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PerfectLoginScreen;
