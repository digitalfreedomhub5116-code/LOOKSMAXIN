import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Theme';

const { width: SW, height: SH } = Dimensions.get('window');
const BRACKET_SIZE = 48;
const BRACKET_THICKNESS = 3;
const FRAME_W = SW * 0.72;
const FRAME_H = FRAME_W * 1.3;
const SCAN_AREA_TOP = (SH * 0.5) - (FRAME_H / 2) - 40;

/**
 * Sci-Fi HUD overlay for the camera scanner.
 * - Glowing corner brackets framing the face
 * - Animated horizontal laser scan line
 * - Pulsing bracket glow
 */
export default function ScannerHUD() {
  const scanLineY = useRef(new Animated.Value(0)).current;
  const bracketPulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Scan line sweep
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, {
          toValue: FRAME_H - 4,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(scanLineY, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Bracket pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(bracketPulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(bracketPulse, {
          toValue: 0.5,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const bracketColor = Colors.primary;

  return (
    <View style={[styles.overlay, { top: SCAN_AREA_TOP }]} pointerEvents="none">
      {/* Face frame area */}
      <View style={styles.frame}>
        {/* Corner brackets */}
        <Animated.View style={[styles.corner, styles.tl, { opacity: bracketPulse }]}>
          <View style={[styles.hBar, { backgroundColor: bracketColor }]} />
          <View style={[styles.vBar, { backgroundColor: bracketColor }]} />
        </Animated.View>
        <Animated.View style={[styles.corner, styles.tr, { opacity: bracketPulse }]}>
          <View style={[styles.hBar, { backgroundColor: bracketColor, alignSelf: 'flex-end' }]} />
          <View style={[styles.vBar, { backgroundColor: bracketColor, alignSelf: 'flex-end' }]} />
        </Animated.View>
        <Animated.View style={[styles.corner, styles.bl, { opacity: bracketPulse }]}>
          <View style={[styles.vBar, { backgroundColor: bracketColor }]} />
          <View style={[styles.hBar, { backgroundColor: bracketColor }]} />
        </Animated.View>
        <Animated.View style={[styles.corner, styles.br, { opacity: bracketPulse }]}>
          <View style={[styles.vBar, { backgroundColor: bracketColor, alignSelf: 'flex-end' }]} />
          <View style={[styles.hBar, { backgroundColor: bracketColor, alignSelf: 'flex-end' }]} />
        </Animated.View>

        {/* Laser scan line */}
        <Animated.View
          style={[
            styles.scanLineWrap,
            { transform: [{ translateY: scanLineY }] },
          ]}
        >
          <LinearGradient
            colors={['transparent', '#5CE1E6', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.scanLine}
          />
          {/* Glow beneath line */}
          <LinearGradient
            colors={['rgba(92, 225, 230, 0.25)', 'transparent']}
            style={styles.scanGlow}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: (SW - FRAME_W) / 2,
    width: FRAME_W,
    height: FRAME_H,
    zIndex: 10,
  },
  frame: {
    width: '100%',
    height: '100%',
  },
  corner: {
    position: 'absolute',
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
  },
  tl: { top: 0, left: 0 },
  tr: { top: 0, right: 0 },
  bl: { bottom: 0, left: 0, justifyContent: 'flex-end' },
  br: { bottom: 0, right: 0, justifyContent: 'flex-end' },
  hBar: {
    width: BRACKET_SIZE,
    height: BRACKET_THICKNESS,
    borderRadius: 1,
  },
  vBar: {
    width: BRACKET_THICKNESS,
    height: BRACKET_SIZE,
    borderRadius: 1,
  },
  scanLineWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 30,
  },
  scanLine: {
    width: '100%',
    height: 2,
  },
  scanGlow: {
    width: '100%',
    height: 28,
  },
});
