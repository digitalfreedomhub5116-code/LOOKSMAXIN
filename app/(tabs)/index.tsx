import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Easing,
  Dimensions, TouchableOpacity, Platform, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Gradients, Typography, Spacing, BorderRadius, Glass, Shadows } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { getLatestScan, getScanCount, type FaceScores } from '@/lib/gemini';

const { width } = Dimensions.get('window');
const RING_SIZE = 160;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Animated SVG circle
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ──────────────────────────────────────────
//  TASK DATA BY TIME OF DAY
// ──────────────────────────────────────────
type TimeFilter = 'Morning' | 'Afternoon' | 'Night';

interface Task {
  id: string;
  title: string;
  duration: string;
  xp: number;
  icon: string;
}

const TASKS: Record<TimeFilter, Task[]> = {
  Morning: [
    { id: 'm1', title: 'Rice Water Face Mask', duration: '10 mins', xp: 15, icon: 'water-outline' },
    { id: 'm2', title: 'Brush Lips (Exfoliate)', duration: '3 mins', xp: 10, icon: 'brush-outline' },
    { id: 'm3', title: 'Morning Skincare Routine', duration: '8 mins', xp: 20, icon: 'sparkles-outline' },
    { id: 'm4', title: 'Cold Water Splash (Face)', duration: '2 mins', xp: 10, icon: 'snow-outline' },
    { id: 'm5', title: 'Drink Lemon Water', duration: '1 min', xp: 5, icon: 'cafe-outline' },
  ],
  Afternoon: [
    { id: 'a1', title: 'Posture Check & Correct', duration: '5 mins', xp: 10, icon: 'body-outline' },
    { id: 'a2', title: 'Jawline Exercises', duration: '10 mins', xp: 20, icon: 'fitness-outline' },
    { id: 'a3', title: 'Mewing Practice', duration: '5 mins', xp: 15, icon: 'pulse-outline' },
    { id: 'a4', title: 'Hydrate (2L Target)', duration: '—', xp: 10, icon: 'water-outline' },
  ],
  Night: [
    { id: 'n1', title: 'Night Skincare Routine', duration: '10 mins', xp: 20, icon: 'moon-outline' },
    { id: 'n2', title: 'Apply Under-Eye Cream', duration: '2 mins', xp: 10, icon: 'eye-outline' },
    { id: 'n3', title: 'Face Massage (Gua Sha)', duration: '8 mins', xp: 15, icon: 'hand-left-outline' },
    { id: 'n4', title: 'Sleep 8 Hours', duration: '8 hrs', xp: 25, icon: 'bed-outline' },
  ],
};

// ──────────────────────────────────────────
//  TASK CARD COMPONENT
// ──────────────────────────────────────────
function TaskCard({ task, done, onToggle }: { task: Task; done: boolean; onToggle: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const checkFill = useRef(new Animated.Value(done ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(checkFill, { toValue: done ? 1 : 0, duration: 300, useNativeDriver: false }).start();
  }, [done]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 150, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  const checkBg = checkFill.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(142,161,188,0.06)', 'rgba(142,161,188,0.25)'],
  });
  const checkBorder = checkFill.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(142,161,188,0.35)', '#8ea1bc'],
  });

  return (
    <Animated.View style={[styles.taskCard, { transform: [{ scale }] }]}>
      {/* Checkbox */}
      <Pressable onPress={handlePress}>
        <Animated.View style={[styles.checkbox, { backgroundColor: checkBg, borderColor: checkBorder }]}>
          {done && <Ionicons name="checkmark" size={16} color="#8ea1bc" />}
        </Animated.View>
      </Pressable>

      {/* Content */}
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, done && styles.taskTitleDone]}>{task.title}</Text>
        <View style={styles.taskSubRow}>
          <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
          <Text style={styles.taskDuration}>{task.duration}</Text>
        </View>
      </View>

      {/* XP Badge */}
      <View style={[styles.xpBadge, done && styles.xpBadgeDone]}>
        <Text style={[styles.xpText, done && styles.xpTextDone]}>+{task.xp} XP</Text>
      </View>
    </Animated.View>
  );
}

// ──────────────────────────────────────────
//  DASHBOARD SCREEN
// ──────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;
  const ringProgress = useRef(new Animated.Value(0)).current;

  const [faceScores, setFaceScores] = useState<FaceScores | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Night';
  });
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Mount animation
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

  // Compute progress
  const currentTasks = TASKS[timeFilter];
  const totalTasks = currentTasks.length;
  const doneTasks = currentTasks.filter(t => completedTasks.has(t.id)).length;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const totalXP = currentTasks.filter(t => completedTasks.has(t.id)).reduce((s, t) => s + t.xp, 0);

  // Animate ring on pct change
  useEffect(() => {
    Animated.timing(ringProgress, {
      toValue: pct,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const strokeDashoffset = ringProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });

  const toggleTask = (id: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const TIME_FILTERS: TimeFilter[] = ['Morning', 'Afternoon', 'Night'];
  const filterIcon = (f: TimeFilter) =>
    f === 'Morning' ? 'sunny-outline' : f === 'Afternoon' ? 'partly-sunny-outline' : 'moon-outline';

  return (
    <View style={styles.container}>
      <LinearGradient colors={[...Gradients.heroBackground]} style={StyleSheet.absoluteFillObject} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ─── Header ─── */}
        <Animated.View style={[styles.header, { opacity: fadeIn }]}>
          <View>
            <Text style={styles.headerTitle}>Today's Routine</Text>
            <Text style={styles.headerSub}>{doneTasks}/{totalTasks} completed · {totalXP} XP earned</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>12 Day Streak</Text>
          </View>
        </Animated.View>

        {/* ─── Progress Ring ─── */}
        <Animated.View style={[styles.ringSection, { opacity: fadeIn, transform: [{ translateY: cardSlide }] }]}>
          <View style={styles.ringContainer}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              {/* Track */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke="rgba(142,161,188,0.1)"
                strokeWidth={RING_STROKE}
                fill="transparent"
              />
              {/* Progress fill */}
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke="#8ea1bc"
                strokeWidth={RING_STROKE}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                rotation={-90}
                origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
              />
            </Svg>
            {/* Center text */}
            <View style={styles.ringCenter}>
              <Text style={styles.ringPct}>{pct}%</Text>
              <Text style={styles.ringLabel}>Daily Goals</Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── Time Filter Pills ─── */}
        <Animated.View style={[styles.filterRow, { opacity: fadeIn }]}>
          {TIME_FILTERS.map(f => {
            const active = f === timeFilter;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setTimeFilter(f)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={filterIcon(f) as any}
                  size={14}
                  color={active ? '#050A1F' : Colors.textMuted}
                />
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* ─── Task Cards ─── */}
        {currentTasks.map((task, i) => (
          <Animated.View
            key={task.id}
            style={{
              opacity: fadeIn,
              transform: [{ translateY: Animated.multiply(cardSlide, new Animated.Value(1 + i * 0.15)) }],
            }}
          >
            <TaskCard
              task={task}
              done={completedTasks.has(task.id)}
              onToggle={() => toggleTask(task.id)}
            />
          </Animated.View>
        ))}

        {/* ─── Face Stats Mini-Card ─── */}
        {faceScores && (
          <Animated.View style={[styles.faceCard, { opacity: fadeIn }]}>
            <View style={styles.faceCardHeader}>
              <Ionicons name="scan-outline" size={16} color={Colors.primary} />
              <Text style={styles.faceCardTitle}>Lynx Score: {faceScores.overall}</Text>
              <TouchableOpacity
                style={styles.scanBtn}
                onPress={() => router.push('/face-scan')}
                activeOpacity={0.8}
              >
                <Text style={styles.scanBtnText}>RESCAN</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {!faceScores && (
          <Animated.View style={[styles.faceCard, { opacity: fadeIn }]}>
            <TouchableOpacity
              style={styles.noScanRow}
              onPress={() => router.push('/face-scan')}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={20} color={Colors.primary} />
              <Text style={styles.noScanText}>Scan your face to get personalized tasks</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 110 }} />
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

// ──────────────────────────────────────────
//  STYLES
// ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: Platform.OS === 'ios' ? 64 : 48, paddingHorizontal: Spacing.xl },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(123,44,191,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(123,44,191,0.35)',
  },
  streakEmoji: { fontSize: 14 },
  streakText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#C084FC',
    letterSpacing: 0.5,
  },

  // Progress Ring
  ringSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPct: {
    fontSize: 38,
    fontWeight: Typography.weights.extrabold,
    color: Colors.textPrimary,
  },
  ringLabel: {
    fontSize: Typography.sizes.xs,
    color: '#D0D6E0',
    letterSpacing: 1.5,
    fontWeight: Typography.weights.semibold,
    marginTop: 1,
  },

  // Filter pills
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(142,161,188,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(142,161,188,0.12)',
  },
  filterPillActive: {
    backgroundColor: '#8ea1bc',
    borderColor: '#8ea1bc',
  },
  filterText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  filterTextActive: {
    color: '#050A1F',
  },

  // Task cards
  taskCard: {
    ...Glass.panel,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: { flex: 1 },
  taskTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  taskTitleDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  taskSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  taskDuration: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  xpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(142,161,188,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(142,161,188,0.2)',
  },
  xpBadgeDone: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.25)',
  },
  xpText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: '#8ea1bc',
    letterSpacing: 0.5,
  },
  xpTextDone: {
    color: Colors.success,
  },

  // Face mini-card
  faceCard: {
    ...Glass.panel,
    padding: Spacing.base,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  faceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  faceCardTitle: {
    flex: 1,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  scanBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(142,161,188,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(142,161,188,0.3)',
  },
  scanBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    letterSpacing: 1,
  },
  noScanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  noScanText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: Spacing.xl,
    borderRadius: 28,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  fabGrad: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
