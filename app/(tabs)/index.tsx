import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Typography, Spacing, BorderRadius, Glass, Shadows } from '@/constants/Theme';

const { width } = Dimensions.get('window');
const RING_SIZE = 160;

export default function DashboardScreen() {
  const ringProgress = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  // Determine time of day
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Night';
  const greetingIcon = hour < 12 ? 'sunny-outline' : hour < 17 ? 'partly-sunny-outline' : 'moon-outline';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...Gradients.heroBackground]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        {/* ─── Progress Ring Section ─── */}
        <Animated.View
          style={[
            styles.progressSection,
            { opacity: fadeIn, transform: [{ translateY: cardSlide }] },
          ]}
        >
          <View style={styles.progressRing}>
            {/* Outer decorative ring */}
            <View style={styles.ringOuter} />
            {/* Progress visual (static for now — will be animated SVG) */}
            <View style={styles.ringInner}>
              <Text style={styles.progressPercent}>73%</Text>
              <Text style={styles.progressLabel}>Daily Goal</Text>
            </View>
          </View>
          <View style={styles.progressMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>5/7</Text>
              <Text style={styles.metaLabel}>Tasks Done</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>82</Text>
              <Text style={styles.metaLabel}>Lynx Score</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>Lvl 4</Text>
              <Text style={styles.metaLabel}>Rank</Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── Time-Filtered Section Header ─── */}
        <Animated.View style={[styles.sectionHeader, { opacity: fadeIn }]}>
          <Ionicons name={greetingIcon as any} size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>{timeOfDay} Routine</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>3 tasks</Text>
          </View>
        </Animated.View>

        {/* ─── Task Cards ─── */}
        {[
          { icon: 'water-outline', title: 'Drink Water (500ml)', time: '7:00 AM', done: true },
          { icon: 'fitness-outline', title: 'Morning Skincare Routine', time: '7:30 AM', done: true },
          { icon: 'barbell-outline', title: 'Jawline Exercises (10 min)', time: '8:00 AM', done: false },
        ].map((task, i) => (
          <Animated.View
            key={i}
            style={[
              styles.taskCard,
              {
                opacity: fadeIn,
                transform: [{ translateY: Animated.multiply(cardSlide, new Animated.Value(1 + i * 0.2)) }],
              },
            ]}
          >
            <View style={[styles.taskIcon, task.done && styles.taskIconDone]}>
              <Ionicons
                name={task.done ? 'checkmark' : (task.icon as any)}
                size={18}
                color={task.done ? Colors.success : Colors.primary}
              />
            </View>
            <View style={styles.taskContent}>
              <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>
                {task.title}
              </Text>
              <Text style={styles.taskTime}>{task.time}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={Colors.textDisabled}
            />
          </Animated.View>
        ))}

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  streakText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: '#F59E0B',
  },
  notifButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(142, 161, 188, 0.08)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.error,
  },
  progressSection: {
    ...Glass.card,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  progressRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  ringOuter: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
    borderColor: 'rgba(142, 161, 188, 0.1)',
  },
  ringInner: {
    width: RING_SIZE - 24,
    height: RING_SIZE - 24,
    borderRadius: (RING_SIZE - 24) / 2,
    backgroundColor: 'rgba(142, 161, 188, 0.04)',
    borderWidth: 3,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.glow,
  },
  progressPercent: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.extrabold,
    color: Colors.textPrimary,
  },
  progressLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
    fontWeight: Typography.weights.semibold,
    marginTop: 2,
  },
  progressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  metaLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  metaDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderSubtle,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    flex: 1,
  },
  sectionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(142, 161, 188, 0.1)',
  },
  sectionBadgeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  taskCard: {
    ...Glass.panel,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  taskIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 161, 188, 0.08)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskIconDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  taskTitleDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  taskTime: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
});
