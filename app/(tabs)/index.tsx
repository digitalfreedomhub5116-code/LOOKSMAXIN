import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Easing,
  Dimensions, TouchableOpacity, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Gradients, Typography, Spacing, BorderRadius, Glass, Shadows } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { getLatestScan, getScanCount, type FaceScores } from '@/lib/gemini';

const { width } = Dimensions.get('window');
const RING_SIZE = 140;

// ─── Metric mini-bar for dashboard ───
function MiniMetric({ label, score, color, delay }: { label: string; score: number; color: string; delay: number }) {
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(barWidth, { toValue: score, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    }, delay);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <View style={styles.miniMetricRow}>
      <Text style={styles.miniMetricLabel}>{label}</Text>
      <View style={styles.miniTrackBg}>
        <Animated.View
          style={[
            styles.miniTrackFill,
            {
              backgroundColor: color,
              width: barWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
      <Text style={styles.miniMetricScore}>{score}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;

  const [faceScores, setFaceScores] = useState<FaceScores | null>(null);
  const [scanCount, setScanCount] = useState(0);

  // Animate on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(cardSlide, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, []);

  // Load latest scan every time tab is focused
  useFocusEffect(
    useCallback(() => {
      if (user) {
        getLatestScan(user.id).then(setFaceScores).catch(() => {});
        getScanCount(user.id).then(setScanCount).catch(() => {});
      }
    }, [user])
  );

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Night';
  const greetingIcon = hour < 12 ? 'sunny-outline' : hour < 17 ? 'partly-sunny-outline' : 'moon-outline';

  const FACE_METRICS = faceScores
    ? [
        { label: 'Jawline',      score: faceScores.jawline,          color: '#8ea1bc' },
        { label: 'Skin',         score: faceScores.skin_quality,     color: '#5CE1E6' },
        { label: 'Eyes',         score: faceScores.eyes,             color: '#8ea1bc' },
        { label: 'Lips',         score: faceScores.lips,             color: '#7B2CBF' },
        { label: 'Symmetry',     score: faceScores.facial_symmetry,  color: '#5CE1E6' },
        { label: 'Hair',         score: faceScores.hair_quality,     color: '#8ea1bc' },
      ]
    : [];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[...Gradients.heroBackground]} style={StyleSheet.absoluteFillObject} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── Header ─── */}
        <Animated.View style={[styles.header, { opacity: fadeIn }]}>
          <View>
            <Text style={styles.greeting}>Good {timeOfDay}</Text>
            <Text style={styles.userName}>Champion</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color="#F59E0B" />
              <Text style={styles.streakText}>7</Text>
            </View>
            <View style={styles.notifButton}>
              <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
              <View style={styles.notifDot} />
            </View>
          </View>
        </Animated.View>

        {/* ─── Lynx Score Ring ─── */}
        <Animated.View style={[styles.progressSection, { opacity: fadeIn, transform: [{ translateY: cardSlide }] }]}>
          <View style={styles.progressRing}>
            <View style={styles.ringOuter} />
            <View style={styles.ringInner}>
              <Text style={styles.progressPercent}>{faceScores ? faceScores.overall : '—'}</Text>
              <Text style={styles.progressLabel}>LYNX SCORE</Text>
            </View>
          </View>
          <View style={styles.progressMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{scanCount}</Text>
              <Text style={styles.metaLabel}>Scans</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{faceScores ? `+${faceScores.potential}` : '—'}</Text>
              <Text style={styles.metaLabel}>Potential</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>Lvl {Math.max(1, Math.floor((faceScores?.overall || 0) / 20))}</Text>
              <Text style={styles.metaLabel}>Rank</Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── Face Stats Card ─── */}
        <Animated.View style={[styles.faceCard, { opacity: fadeIn, transform: [{ translateY: cardSlide }] }]}>
          <View style={styles.faceCardHeader}>
            <View style={styles.faceCardTitleRow}>
              <Ionicons name="scan-outline" size={18} color={Colors.primary} />
              <Text style={styles.faceCardTitle}>Face Analysis</Text>
            </View>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => router.push('/face-scan')}
              activeOpacity={0.8}
              id="dashboard-scan-btn"
            >
              <LinearGradient colors={['#8ea1bc', '#6B8AAE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.scanBtnGrad}>
                <Ionicons name="add" size={16} color={Colors.background} />
                <Text style={styles.scanBtnText}>SCAN</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {faceScores ? (
            <View style={styles.metricsGrid}>
              {FACE_METRICS.map((m, i) => (
                <MiniMetric key={m.label} label={m.label} score={m.score} color={m.color} delay={200 + i * 80} />
              ))}
            </View>
          ) : (
            <View style={styles.noScanWrap}>
              <Ionicons name="camera-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.noScanText}>No scan yet</Text>
              <Text style={styles.noScanSub}>Tap + SCAN to get your AI face analysis</Text>
            </View>
          )}
        </Animated.View>

        {/* ─── Time-Filtered Routine ─── */}
        <Animated.View style={[styles.sectionHeader, { opacity: fadeIn }]}>
          <Ionicons name={greetingIcon as any} size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>{timeOfDay} Routine</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>3 tasks</Text>
          </View>
        </Animated.View>

        {[
          { icon: 'water-outline', title: 'Drink Water (500ml)', time: '7:00 AM', done: true },
          { icon: 'fitness-outline', title: 'Morning Skincare Routine', time: '7:30 AM', done: true },
          { icon: 'barbell-outline', title: 'Jawline Exercises (10 min)', time: '8:00 AM', done: false },
        ].map((task, i) => (
          <Animated.View
            key={i}
            style={[styles.taskCard, { opacity: fadeIn, transform: [{ translateY: Animated.multiply(cardSlide, new Animated.Value(1 + i * 0.2)) }] }]}
          >
            <View style={[styles.taskIcon, task.done && styles.taskIconDone]}>
              <Ionicons name={task.done ? 'checkmark' : (task.icon as any)} size={18} color={task.done ? Colors.success : Colors.primary} />
            </View>
            <View style={styles.taskContent}>
              <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>{task.title}</Text>
              <Text style={styles.taskTime}>{task.time}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
          </Animated.View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── Floating Scan FAB ─── */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/face-scan')}
        id="dashboard-fab-scan"
      >
        <LinearGradient colors={['#8ea1bc', '#6B8AAE']} style={styles.fabGrad}>
          <Ionicons name="scan" size={24} color={Colors.background} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingHorizontal: Spacing.xl },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  greeting: { fontSize: Typography.sizes.md, color: Colors.textMuted, fontWeight: Typography.weights.medium, letterSpacing: 0.5 },
  userName: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' },
  streakText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: '#F59E0B' },
  notifButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(142,161,188,0.08)', borderWidth: 1, borderColor: Colors.borderSubtle, justifyContent: 'center', alignItems: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.error },

  // Progress ring
  progressSection: { ...Glass.card, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl },
  progressRing: { width: RING_SIZE, height: RING_SIZE, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg },
  ringOuter: { position: 'absolute', width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, borderWidth: 3, borderColor: 'rgba(142,161,188,0.1)' },
  ringInner: { width: RING_SIZE - 24, height: RING_SIZE - 24, borderRadius: (RING_SIZE - 24) / 2, backgroundColor: 'rgba(142,161,188,0.04)', borderWidth: 3, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadows.glow },
  progressPercent: { fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.extrabold, color: Colors.textPrimary },
  progressLabel: { fontSize: 10, color: Colors.textMuted, letterSpacing: 2, fontWeight: Typography.weights.semibold, marginTop: 2 },
  progressMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  metaItem: { alignItems: 'center' },
  metaValue: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  metaLabel: { fontSize: Typography.sizes.xs, color: Colors.textMuted, letterSpacing: 0.5, marginTop: 2 },
  metaDivider: { width: 1, height: 28, backgroundColor: Colors.borderSubtle },

  // Face analysis card
  faceCard: { ...Glass.card, padding: Spacing.lg, marginBottom: Spacing.xl },
  faceCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base },
  faceCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  faceCardTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary, letterSpacing: 0.5 },
  scanButton: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  scanBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  scanBtnText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.background, letterSpacing: 1.5 },
  metricsGrid: { gap: Spacing.sm },
  noScanWrap: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  noScanText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textSecondary },
  noScanSub: { fontSize: Typography.sizes.sm, color: Colors.textMuted, textAlign: 'center' },

  // Mini metric bars
  miniMetricRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  miniMetricLabel: { width: 64, fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, color: Colors.textMuted, letterSpacing: 0.5 },
  miniTrackBg: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(142,161,188,0.08)', overflow: 'hidden' },
  miniTrackFill: { height: '100%', borderRadius: 3 },
  miniMetricScore: { width: 24, fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.textPrimary, textAlign: 'right' },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.base },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, letterSpacing: 0.5, flex: 1 },
  sectionBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, backgroundColor: 'rgba(142,161,188,0.1)' },
  sectionBadgeText: { fontSize: Typography.sizes.xs, color: Colors.textMuted, fontWeight: Typography.weights.medium },

  // Task cards
  taskCard: { ...Glass.panel, flexDirection: 'row', alignItems: 'center', padding: Spacing.base, marginBottom: Spacing.md, gap: Spacing.md },
  taskIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(142,161,188,0.08)', borderWidth: 1, borderColor: Colors.borderSubtle, justifyContent: 'center', alignItems: 'center' },
  taskIconDone: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.25)' },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.medium, color: Colors.textPrimary, letterSpacing: 0.3 },
  taskTitleDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  taskTime: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 2, letterSpacing: 0.3 },

  // FAB
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, right: Spacing.xl, borderRadius: 28, overflow: 'hidden', ...Shadows.glow },
  fabGrad: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
});
