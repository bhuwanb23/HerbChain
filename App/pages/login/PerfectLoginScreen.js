import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
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
import { GlobalTranslationProvider, useGlobalTranslation } from '../../language/GlobalTranslationContext';

const { width } = Dimensions.get('window');

const LoginScreenContent = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const { t, changeLanguage } = useGlobalTranslation();

  useEffect(() => {
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
  }, []);

  const translateRole = (roleId) => {
    switch (roleId) {
      case 'Farmer':
        return t.login.roles.farmer;
      case 'Transporter':
        return t.login.roles.transporter;
      case 'Lab':
        return t.login.roles.lab;
      case 'AYUSH/Admin':
        return t.login.roles.ayushAdmin;
      case 'Consumer':
        return t.login.roles.consumer;
      case 'Manufacturer':
        return t.login.roles.manufacturer;
      default:
        return roleId;
    }
  };

  const handleLogin = (credentials) => {
    // Quick login - just check if role is selected
    if (!selectedRole) {
      Alert.alert(t.login.errorTitle, t.login.selectRoleFirst);
      return;
    }
    
    // Navigate directly to respective dashboard based on role
    switch (selectedRole) {
      case 'Farmer':
        navigation.navigate('FarmerDashboard');
        break;
      case 'Transporter':
        navigation.navigate('TransporterDashboard');
        break;
      case 'Lab':
        navigation.navigate('LabBatchesPage');
        break;
      case 'AYUSH/Admin':
        navigation.navigate('AdminDashboard');
        break;
      case 'Consumer':
        navigation.navigate('ConsumerDashboard');
        break;
      case 'Manufacturer':
        navigation.navigate('ManufacturerMainPage');
        break;
      default:
        Alert.alert(t.login.successTitle, `${t.login.loginSuccessful} ${translateRole(selectedRole)}`);
    }
  };

  const handleSignUp = () => {
    Alert.alert(t.login.signUp, t.login.signUpAlert);
  };

  const handleLanguageChange = (selectedLang) => {
    changeLanguage(selectedLang.code);
  };

  const handleForgotPassword = () => {
    Alert.alert(t.login.forgotPassword, t.login.forgotPasswordAlert);
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(t.login.privacyPolicy, t.login.privacyPolicyAlert);
  };

  const handleTermsOfService = () => {
    Alert.alert(t.login.termsOfService, t.login.termsOfServiceAlert);
  };

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

          {/* Quick Login Info */}
          <View style={styles.demoCredentialsContainer}>
            <Text style={styles.demoCredentialsTitle}>{t.login.quickLoginTitle}</Text>
            <Text style={styles.demoCredentialsText}>
              {t.login.quickLoginText}
            </Text>
          </View>

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

const PerfectLoginScreen = ({ navigation }) => {
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  if (showIntro) {
    return <PerfectIntro onAnimationComplete={handleIntroComplete} />;
  }

  return <LoginScreenContent navigation={navigation} />;
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
  demoCredentialsContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  demoCredentialsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
    marginBottom: 8,
    textAlign: 'center',
  },
  demoCredentialsText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default PerfectLoginScreen;
