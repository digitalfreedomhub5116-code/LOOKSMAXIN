import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Theme';

const { width: SW } = Dimensions.get('window');

// ─── Metric Progress Bar ───
interface MetricProps {
  label: string;
  score: number;
  color: string;
  delay: number;
}

function MetricBar({ label, score, color, delay }: MetricProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(widthAnim, {
        toValue: score,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [score, delay]);

  return (
    <View style={styles.metricRow}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Animated.Text style={styles.metricValue}>
          {widthAnim.interpolate({
            inputRange: [0, 100],
            outputRange: ['0', '100'],
          }).interpolate({
            inputRange: [0, 100],
            outputRange: ['0', '100'],
          }) ? `${score}` : '0'}
        </Animated.Text>
      </View>
      <View style={styles.trackBg}>
        <Animated.View
          style={[
            styles.trackFillWrap,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={[color, `${color}88`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.trackFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Circular Score Ring (View-based) ───
interface ScoreRingProps {
  score: number;
  size?: number;
}

function ScoreRing({ score, size = 180 }: ScoreRingProps) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        delay: 400,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        delay: 400,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const borderW = 6;
  const outerR = size / 2;

  return (
    <Animated.View
      style={[
        styles.ringContainer,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Outer glow */}
      <View style={[styles.ringGlow, { width: size + 40, height: size + 40, borderRadius: (size + 40) / 2 }]} />

      {/* Track ring */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: outerR,
          borderWidth: borderW,
          borderColor: 'rgba(142, 161, 188, 0.10)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Accent arc overlay (simulated with a partial border) */}
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: outerR,
            borderWidth: borderW,
            borderColor: 'transparent',
            borderTopColor: Colors.primary,
            borderRightColor: score > 25 ? Colors.primary : 'transparent',
            borderBottomColor: score > 50 ? Colors.primary : 'transparent',
            borderLeftColor: score > 75 ? Colors.primary : 'transparent',
            transform: [{ rotate: '-45deg' }],
          }}
        />
      </View>

      {/* Center label */}
      <View style={[styles.ringCenter, { width: size, height: size }]}>
        <Text style={styles.ringScore}>{score}</Text>
        <Text style={styles.ringLabel}>OVERALL</Text>
      </View>
    </Animated.View>
  );
}

// ─── Main Export ───
export interface FaceMetric {
  label: string;
  score: number;
  color: string;
}

interface Props {
  metrics: FaceMetric[];
  overallScore: number;
  potentialGain: number;
}

export default function ScoreResults({ metrics, overallScore, potentialGain }: Props) {
  return (
    <View style={styles.container}>
      {/* Metric bars */}
      <View style={styles.metricsCard}>
        {metrics.map((m, i) => (
          <MetricBar
            key={m.label}
            label={m.label}
            score={m.score}
            color={m.color}
            delay={200 + i * 120}
          />
        ))}
      </View>

      {/* Overall ring */}
      <ScoreRing score={overallScore} />

      {/* Potential gain badge */}
      <View style={styles.potentialBadge}>
        <Text style={styles.potentialPlus}>+{potentialGain}</Text>
        <Text style={styles.potentialLabel}>Potential Improvement</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },

  // Metrics card
  metricsCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 52, 0.65)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.base,
    marginBottom: Spacing['2xl'],
  },
  metricRow: {
    gap: 6,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  trackBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(142, 161, 188, 0.08)',
    overflow: 'hidden',
  },
  trackFillWrap: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    flex: 1,
    borderRadius: 3,
  },

  // Score ring
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  ringGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(142, 161, 188, 0.06)',
    ...Shadows.glow,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScore: {
    fontSize: 52,
    fontWeight: Typography.weights.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  ringLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    letterSpacing: 3,
    marginTop: -2,
  },

  // Potential badge
  potentialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(123, 44, 191, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.30)',
  },
  potentialPlus: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: '#7B2CBF',
  },
  potentialLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: 'rgba(123, 44, 191, 0.85)',
    letterSpacing: 0.3,
  },
});
