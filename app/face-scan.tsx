import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Typography, Spacing, Shadows } from '@/constants/Theme';

const { height } = Dimensions.get('window');

/**
 * Face Scan — Placeholder
 * Will be replaced with camera view + sci-fi HUD overlay.
 */
export default function FaceScanScreen() {
  const scanLine = useRef(new Animated.Value(0)).current;
  const ringRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scanLine, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(ringRotation, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  const scanTranslate = scanLine.interpolate({ inputRange: [0, 1], outputRange: [-80, 80] });
  const spin = ringRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...Gradients.heroBackground]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.scanArea}>
        <Animated.View style={[styles.outerRing, { transform: [{ rotate: spin }] }]} />
        <Animated.View style={[styles.scanLineWrap, { transform: [{ translateY: scanTranslate }] }]}>
          <LinearGradient
            colors={[...Gradients.scanLine]}
            style={styles.scanLine}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
        </Animated.View>
        <View style={styles.faceIcon}>
          <Ionicons name="scan-outline" size={56} color={Colors.primary} />
        </View>
      </View>

      <Text style={styles.title}>Face Scanner</Text>
      <Text style={styles.subtitle}>AI-powered facial analysis coming next…</Text>
    </View>
  );
}

const RING = 200;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: Spacing['2xl'] },
  scanArea: { width: RING, height: RING, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing['2xl'] },
  outerRing: {
    position: 'absolute', width: RING, height: RING, borderRadius: RING / 2,
    borderWidth: 1.5, borderColor: 'transparent',
    borderTopColor: Colors.primary,
    borderBottomColor: 'rgba(142,161,188,0.15)',
    borderLeftColor: 'rgba(142,161,188,0.08)',
    borderRightColor: 'rgba(142,161,188,0.3)',
  },
  scanLineWrap: { position: 'absolute', width: RING - 40, height: 2, zIndex: 2 },
  scanLine: { width: '100%', height: '100%' },
  faceIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(142, 161, 188, 0.06)',
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
    ...Shadows.glow,
  },
  title: { fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary, letterSpacing: 2, marginBottom: Spacing.sm },
  subtitle: { fontSize: Typography.sizes.md, color: Colors.textMuted, textAlign: 'center' },
});
