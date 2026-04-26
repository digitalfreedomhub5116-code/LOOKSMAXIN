import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/Theme';

const { width: SCREEN_W } = Dimensions.get('window');

interface LynxBlobProps {
  /** Diameter of the main blob circle */
  size?: number;
}

/**
 * LynxBlob — The animated AI avatar centerpiece.
 *
 * Three layers:
 *  1. Outermost soft radial glow (pulsing opacity)
 *  2. Mid-ring halo with subtle border (pulsing)
 *  3. Gradient sphere with sparkle icon (breathing scale + floating Y)
 *
 * All animations run on the native driver for 60fps.
 */
export default function LynxBlob({ size = 150 }: LynxBlobProps) {
  // ─── Animated values ───
  const floatY = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(1)).current;
  const haloOpacity = useRef(new Animated.Value(0.35)).current;
  const outerGlowOpacity = useRef(new Animated.Value(0.18)).current;
  const innerRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Float up/down ±10px
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -10,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 10,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Breathe scale ±5%
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1.05,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0.95,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Halo pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(haloOpacity, {
          toValue: 0.65,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(haloOpacity, {
          toValue: 0.25,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Outer glow pulse (slower)
    Animated.loop(
      Animated.sequence([
        Animated.timing(outerGlowOpacity, {
          toValue: 0.35,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(outerGlowOpacity, {
          toValue: 0.1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Subtle inner rotation for the sparkle icon
    Animated.loop(
      Animated.timing(innerRotation, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const spin = innerRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const HALO_SIZE = size + 50;
  const GLOW_SIZE = size + 110;

  return (
    <View style={[styles.wrapper, { width: GLOW_SIZE, height: GLOW_SIZE }]}>
      {/* Layer 1: Outermost soft radial glow */}
      <Animated.View
        style={[
          styles.outerGlow,
          {
            width: GLOW_SIZE,
            height: GLOW_SIZE,
            borderRadius: GLOW_SIZE / 2,
            opacity: outerGlowOpacity,
          },
        ]}
      />

      {/* Layer 2: Halo ring */}
      <Animated.View
        style={[
          styles.haloRing,
          {
            width: HALO_SIZE,
            height: HALO_SIZE,
            borderRadius: HALO_SIZE / 2,
            opacity: haloOpacity,
          },
        ]}
      />

      {/* Layer 3: The main blob — floats + breathes */}
      <Animated.View
        style={{
          transform: [
            { translateY: floatY },
            { scale: breathe },
          ],
        }}
      >
        <LinearGradient
          colors={['#7B2CBF', '#9B59D0', '#8ea1bc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.blob,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          {/* Sparkle icon with subtle spin */}
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="sparkles" size={size * 0.32} color="rgba(255,255,255,0.92)" />
          </Animated.View>

          {/* Inner shine highlight */}
          <View
            style={[
              styles.innerShine,
              {
                width: size * 0.55,
                height: size * 0.55,
                borderRadius: (size * 0.55) / 2,
                top: size * 0.08,
                left: size * 0.08,
              },
            ]}
          />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(123, 44, 191, 0.12)',
  },
  haloRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(142, 161, 188, 0.18)',
    backgroundColor: 'rgba(123, 44, 191, 0.04)',
  },
  blob: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(142, 161, 188, 0.25)',
    // Purple glow shadow
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 16,
    overflow: 'hidden',
  },
  innerShine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});
