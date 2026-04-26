import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Spacing, BorderRadius, Typography, Glass, Shadows } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

type AuthMode = 'login' | 'signup';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ─── Animations ───
  const fadeIn = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(60)).current;
  const headerSlide = useRef(new Animated.Value(-30)).current;
  const orbFloat = useRef(new Animated.Value(0)).current;
  const orbPulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Card entrance
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Floating orb
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbFloat, {
          toValue: -12,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbFloat, {
          toValue: 12,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Orb glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbPulse, {
          toValue: 0.6,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleAuth = async () => {
    setErrorMsg('');

    // Validate inputs
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email.trim(), password, name.trim() || undefined);
        if (error) {
          setErrorMsg(error.message || 'Sign up failed');
        } else {
          // New user → go to calibration onboarding
          router.push('/calibration');
        }
      } else {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setErrorMsg(error.message || 'Sign in failed');
        } else {
          // Existing user → go to main app
          router.replace('/(tabs)');
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrorMsg('');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...Gradients.heroBackground]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* ─── Decorative Orbs ─── */}
      <Animated.View
        style={[
          styles.orbPrimary,
          {
            opacity: orbPulse,
            transform: [{ translateY: orbFloat }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orbSecondary,
          {
            opacity: Animated.multiply(orbPulse, 0.7),
            transform: [{ translateY: Animated.multiply(orbFloat, -1) }],
          },
        ]}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Back Button ─── */}
          <Animated.View
            style={[styles.backRow, { opacity: fadeIn, transform: [{ translateY: headerSlide }] }]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              id="login-back-button"
            >
              <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </Animated.View>

          {/* ─── Header ─── */}
          <Animated.View
            style={[styles.header, { opacity: fadeIn, transform: [{ translateY: headerSlide }] }]}
          >
            <View style={styles.logoMark}>
              <Ionicons name="eye-outline" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.headerTitle}>
              {mode === 'login' ? 'Welcome Back' : 'Join Lynx AI'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {mode === 'login'
                ? 'Continue your glow-up journey'
                : 'Start your transformation today'}
            </Text>
          </Animated.View>

          {/* ─── Auth Card ─── */}
          <Animated.View
            style={[
              styles.authCard,
              {
                opacity: fadeIn,
                transform: [{ translateY: cardSlide }],
              },
            ]}
          >
            {/* Name Field (Signup only) */}
            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your name"
                    placeholderTextColor={Colors.textDisabled}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    id="signup-name-input"
                  />
                </View>
              </View>
            )}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textDisabled}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  id="login-email-input"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textDisabled}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  id="login-password-input"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  id="toggle-password-visibility"
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            {mode === 'login' && (
              <TouchableOpacity style={styles.forgotButton} id="forgot-password-button">
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && { opacity: 0.6 }]}
              activeOpacity={0.85}
              onPress={handleAuth}
              disabled={isLoading}
              id="auth-submit-button"
            >
              <LinearGradient
                colors={['#8ea1bc', '#6B8AAE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>
                  {isLoading
                    ? 'PLEASE WAIT...'
                    : mode === 'login'
                    ? 'SIGN IN'
                    : 'CREATE ACCOUNT'}
                </Text>
                {!isLoading && (
                  <Ionicons name="arrow-forward" size={18} color={Colors.background} />
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Auth Buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton} id="google-auth-button">
                <Ionicons name="logo-google" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} id="apple-auth-button">
                <Ionicons name="logo-apple" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} id="github-auth-button">
                <Ionicons name="logo-github" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ─── Toggle Mode ─── */}
          <Animated.View style={[styles.toggleArea, { opacity: fadeIn }]}>
            <Text style={styles.toggleText}>
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <TouchableOpacity onPress={toggleMode} id="toggle-auth-mode">
              <Text style={styles.toggleLink}>
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['3xl'],
  },
  orbPrimary: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(142, 161, 188, 0.06)',
  },
  orbSecondary: {
    position: 'absolute',
    bottom: 100,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(123, 44, 191, 0.06)',
  },
  backRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 161, 188, 0.08)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(142, 161, 188, 0.08)',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
    ...Shadows.glow,
  },
  headerTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  authCard: {
    ...Glass.panel,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.base,
  },
  inputLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    ...Glass.input,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.xs,
    gap: Spacing.md,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },
  forgotText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
    letterSpacing: 0.3,
  },
  submitButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
    ...Shadows.glow,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
  },
  submitText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.background,
    letterSpacing: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  dividerText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textDisabled,
    fontWeight: Typography.weights.semibold,
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.base,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(142, 161, 188, 0.06)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  toggleText: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
  },
  toggleLink: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.20)',
  },
  errorText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
  },
});
