import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Spacing, BorderRadius, Typography, Glass, Shadows } from '@/constants/Theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  // ─── Animated Values ───
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoGlow = useRef(new Animated.Value(0)).current;
  const ringRotation = useRef(new Animated.Value(0)).current;
  const ring2Rotation = useRef(new Animated.Value(0)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(30)).current;
  const particleOpacity = useRef(new Animated.Value(0)).current;
  const scanLine = useRef(new Animated.Value(-height * 0.15)).current;

  useEffect(() => {
    // Particle background fade in
    Animated.timing(particleOpacity, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Logo entrance
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: false,
        }),
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    // Logo glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlow, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(logoGlow, {
          toValue: 0.3,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Ring rotation
    Animated.loop(
      Animated.timing(ringRotation, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    Animated.loop(
      Animated.timing(ring2Rotation, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    // Scan line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: height * 0.15,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(scanLine, {
          toValue: -height * 0.15,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Subtitle entrance
    Animated.sequence([
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(subtitleFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    // Button entrance
    Animated.sequence([
      Animated.delay(1400),
      Animated.parallel([
        Animated.timing(buttonFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(buttonSlide, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);

  const ringSpin = ringRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const ring2Spin = ring2Rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...Gradients.heroBackground]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* ─── Ambient Particles ─── */}
      <Animated.View style={[styles.particleField, { opacity: particleOpacity }]}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.particle,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.1,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* ─── Grid Lines (Subtle Background) ─── */}
      <View style={styles.gridOverlay}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineH, { top: (height / 8) * i }]} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineV, { left: (width / 6) * i }]} />
        ))}
      </View>

      {/* ─── Main Content ─── */}
      <View style={styles.content}>
        {/* Logo Area */}
        <View style={styles.logoArea}>
          {/* Outer Ring */}
          <Animated.View
            style={[
              styles.outerRing,
              { transform: [{ rotate: ringSpin }] },
            ]}
          />

          {/* Inner Ring */}
          <Animated.View
            style={[
              styles.innerRing,
              { transform: [{ rotate: ring2Spin }] },
            ]}
          />

          {/* Scan Line */}
          <Animated.View
            style={[
              styles.scanLineContainer,
              { transform: [{ translateY: scanLine }] },
            ]}
          >
            <LinearGradient
              colors={[...Gradients.scanLine]}
              style={styles.scanLine}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            />
          </Animated.View>

          {/* Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeIn,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            {/* Glow backdrop */}
            <Animated.View style={[styles.logoGlow, { opacity: logoGlow }]} />

            <View style={styles.logoInner}>
              <Ionicons name="eye-outline" size={48} color={Colors.primary} />
            </View>
          </Animated.View>
        </View>

        {/* Title */}
        <Animated.View
          style={[
            styles.titleArea,
            {
              opacity: subtitleFade,
              transform: [{ translateY: slideUp }],
            },
          ]}
        >
          <Text style={styles.title}>LYNX</Text>
          <Text style={styles.titleAccent}>AI</Text>
          <View style={styles.divider} />
          <Text style={styles.tagline}>Your 360° Glow-Up Engine</Text>
          <Text style={styles.subtitle}>
            AI-powered facial analysis • Habit tracking • Social mastery
          </Text>
        </Animated.View>

        {/* Features Preview */}
        <Animated.View
          style={[
            styles.featuresRow,
            {
              opacity: subtitleFade,
              transform: [{ translateY: slideUp }],
            },
          ]}
        >
          <View style={styles.featurePill}>
            <Ionicons name="scan-outline" size={14} color={Colors.primary} />
            <Text style={styles.featurePillText}>Face Scan</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="trending-up-outline" size={14} color={Colors.accent} />
            <Text style={styles.featurePillText}>Roadmap</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.secondary} />
            <Text style={styles.featurePillText}>AI Coach</Text>
          </View>
        </Animated.View>
      </View>

      {/* ─── Bottom CTA ─── */}
      <Animated.View
        style={[
          styles.bottomArea,
          {
            opacity: buttonFade,
            transform: [{ translateY: buttonSlide }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={() => router.push('/login')}
          id="welcome-cta-button"
        >
          <LinearGradient
            colors={['#8ea1bc', '#6B8AAE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>BEGIN TRANSFORMATION</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.background} />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.versionText}>v1.0 • Powered by Lynx Intelligence</Text>
      </Animated.View>
    </View>
  );
}

const LOGO_SIZE = 140;
const RING_SIZE = 200;
const RING2_SIZE = 170;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  particleField: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(142, 161, 188, 0.03)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(142, 161, 188, 0.03)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    zIndex: 1,
  },
  logoArea: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  outerRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderTopColor: Colors.primary,
    borderBottomColor: 'rgba(142, 161, 188, 0.15)',
    borderLeftColor: 'rgba(142, 161, 188, 0.08)',
    borderRightColor: 'rgba(142, 161, 188, 0.3)',
  },
  innerRing: {
    position: 'absolute',
    width: RING2_SIZE,
    height: RING2_SIZE,
    borderRadius: RING2_SIZE / 2,
    borderWidth: 1,
    borderColor: 'transparent',
    borderTopColor: 'rgba(123, 44, 191, 0.5)',
    borderBottomColor: 'rgba(123, 44, 191, 0.15)',
    borderLeftColor: 'rgba(123, 44, 191, 0.3)',
    borderRightColor: 'rgba(123, 44, 191, 0.08)',
  },
  scanLineContainer: {
    position: 'absolute',
    width: LOGO_SIZE + 20,
    height: 2,
    zIndex: 5,
  },
  scanLine: {
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: LOGO_SIZE + 40,
    height: LOGO_SIZE + 40,
    borderRadius: (LOGO_SIZE + 40) / 2,
    backgroundColor: 'rgba(142, 161, 188, 0.08)',
  },
  logoInner: {
    width: LOGO_SIZE - 20,
    height: LOGO_SIZE - 20,
    borderRadius: (LOGO_SIZE - 20) / 2,
    backgroundColor: 'rgba(142, 161, 188, 0.06)',
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.glow,
  },
  titleArea: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extrabold,
    color: Colors.textPrimary,
    letterSpacing: 12,
    lineHeight: 60,
  },
  titleAccent: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.light,
    color: Colors.primary,
    letterSpacing: 16,
    marginTop: -4,
  },
  divider: {
    width: 60,
    height: 1.5,
    backgroundColor: Colors.primary,
    marginVertical: Spacing.lg,
    opacity: 0.5,
  },
  tagline: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(142, 161, 188, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(142, 161, 188, 0.12)',
  },
  featurePillText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
    letterSpacing: 0.3,
  },
  bottomArea: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    alignItems: 'center',
    zIndex: 1,
  },
  ctaButton: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
  },
  ctaText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.background,
    letterSpacing: 2,
  },
  versionText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textDisabled,
    marginTop: Spacing.base,
    letterSpacing: 0.5,
  },
});
