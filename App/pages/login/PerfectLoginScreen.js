import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
  FooterLinks,
} from './components';
import { useGlobalTranslation } from '../../language/GlobalTranslationContext';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

const LoginScreenContent = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const { t, changeLanguage } = useGlobalTranslation();
  const { login, busy, error } = useAuth();
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async ({ email, password }) => {
    setLocalError(null);
    const identifier = (email || '').trim();
    if (!identifier || !password) {
      setLocalError('Email/user-id and password are required');
      return;
    }
    try {
      await login(identifier, password);
      // AuthGate in AppNavigator handles redirect.
    } catch (err) {
      setLocalError(err?.message || 'Login failed');
    }
  };

  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  const handleLanguageChange = (selectedLang) => {
    changeLanguage(selectedLang.code);
  };

  const handleForgotPassword = () => {
    Alert.alert(
      t.login.forgotPassword,
      'Password reset is not wired up yet. Ask an admin to create a new account.',
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(t.login.privacyPolicy, t.login.privacyPolicyAlert);
  };

  const handleTermsOfService = () => {
    Alert.alert(t.login.termsOfService, t.login.termsOfServiceAlert);
  };

  const message = localError || error;

  return (
    <SafeAreaWrapper style={styles.container} includeBottom>
      <BackgroundPattern />
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
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <LogoSection />

          <LoginForm
            onLogin={handleLogin}
            onForgotPassword={handleForgotPassword}
            busy={busy}
          />

          {message ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{message}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
            <Text style={styles.signUpText}>
              New to HerbChain?
              {'  '}
              <Text style={styles.signUpLink}>Create an account</Text>
            </Text>
          </TouchableOpacity>

          <FooterLinks
            onPrivacyPolicy={handlePrivacyPolicy}
            onTermsOfService={handleTermsOfService}
          />

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
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginTop: 12,
  },
  errorText: { color: '#B91C1C', textAlign: 'center', fontWeight: '500' },
  signUpButton: { marginTop: 18 },
  signUpText: { fontSize: 14, color: '#374151' },
  signUpLink: { color: '#065F46', fontWeight: '700' },
});

export default PerfectLoginScreen;
