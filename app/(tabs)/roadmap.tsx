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

type RoadmapNode = {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  status: 'completed' | 'current' | 'locked';
  xp: number;
};

const ROADMAP_DATA: RoadmapNode[] = [
  { id: 1, title: 'Foundation', subtitle: 'Basic skincare & hygiene', icon: 'leaf-outline', status: 'completed', xp: 50 },
  { id: 2, title: 'Facial Structure', subtitle: 'Jawline & mewing exercises', icon: 'diamond-outline', status: 'completed', xp: 75 },
  { id: 3, title: 'Skin Mastery', subtitle: 'Advanced routines & treatments', icon: 'sparkles-outline', status: 'current', xp: 100 },
  { id: 4, title: 'Body Language', subtitle: 'Posture & presence', icon: 'body-outline', status: 'locked', xp: 120 },
  { id: 5, title: 'Social Dynamics', subtitle: 'Conversation & confidence', icon: 'people-outline', status: 'locked', xp: 150 },
  { id: 6, title: 'Style & Fashion', subtitle: 'Personal brand building', icon: 'shirt-outline', status: 'locked', xp: 175 },
];

function RoadmapNodeCard({ node, index, fadeIn, slideUp }: {
  node: RoadmapNode;
  index: number;
  fadeIn: Animated.Value;
  slideUp: Animated.Value;
}) {
  const isCompleted = node.status === 'completed';
  const isCurrent = node.status === 'current';
  const isLocked = node.status === 'locked';

  return (
    <Animated.View
      style={[
        styles.nodeRow,
        { opacity: fadeIn, transform: [{ translateY: Animated.multiply(slideUp, new Animated.Value(1 + index * 0.15)) }] },
      ]}
    >
      {/* Connector Line */}
      <View style={styles.connectorColumn}>
        {index > 0 && (
          <View style={[styles.connectorLine, isCompleted && styles.connectorDone]} />
        )}
        <View
          style={[
            styles.nodeDot,
            isCompleted && styles.nodeDotDone,
            isCurrent && styles.nodeDotCurrent,
            isLocked && styles.nodeDotLocked,
          ]}
        >
          {isCompleted ? (
            <Ionicons name="checkmark" size={12} color={Colors.success} />
          ) : isCurrent ? (
            <View style={styles.currentPulse} />
          ) : (
            <Ionicons name="lock-closed" size={10} color={Colors.textDisabled} />
          )}
        </View>
        {index < ROADMAP_DATA.length - 1 && (
          <View style={[styles.connectorLineBottom, isCompleted && styles.connectorDone]} />
        )}
      </View>

      {/* Card */}
      <View style={[
        styles.nodeCard,
        isCurrent && styles.nodeCardCurrent,
        isLocked && styles.nodeCardLocked,
      ]}>
        <View style={[styles.nodeIconWrap, isCurrent && styles.nodeIconCurrent]}>
          <Ionicons
            name={node.icon}
            size={20}
            color={isLocked ? Colors.textDisabled : isCurrent ? Colors.primary : Colors.success}
          />
        </View>
        <View style={styles.nodeTextArea}>
          <Text style={[styles.nodeTitle, isLocked && styles.nodeLocked]}>
            {node.title}
          </Text>
          <Text style={styles.nodeSubtitle}>{node.subtitle}</Text>
        </View>
        <View style={styles.xpBadge}>
          <Text style={[styles.xpText, isLocked && { color: Colors.textDisabled }]}>
            +{node.xp} XP
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function RoadmapScreen() {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(slideUp, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, []);

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
          <Text style={styles.headerTitle}>Your Roadmap</Text>
          <Text style={styles.headerSubtitle}>Unlock skills • Level up your life</Text>
        </Animated.View>

        {/* ─── Progress Summary ─── */}
        <Animated.View
          style={[
            styles.progressBar,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '33%' }]} />
          </View>
          <Text style={styles.progressText}>2 of 6 skills unlocked</Text>
        </Animated.View>

        {/* ─── Node Map ─── */}
        {ROADMAP_DATA.map((node, index) => (
          <RoadmapNodeCard
            key={node.id}
            node={node}
            index={index}
            fadeIn={fadeIn}
            slideUp={slideUp}
          />
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: Spacing.xl },
  header: { marginBottom: Spacing.xl },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
  progressBar: {
    marginBottom: Spacing['2xl'],
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(142, 161, 188, 0.1)',
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },

  // ─── Node Layout ───
  nodeRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  connectorColumn: {
    width: 32,
    alignItems: 'center',
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(142, 161, 188, 0.1)',
  },
  connectorLineBottom: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(142, 161, 188, 0.1)',
  },
  connectorDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  nodeDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 161, 188, 0.08)',
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeDotDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  nodeDotCurrent: {
    backgroundColor: 'rgba(142, 161, 188, 0.15)',
    borderColor: Colors.primary,
    ...Shadows.glow,
  },
  nodeDotLocked: {
    backgroundColor: 'rgba(62, 74, 102, 0.15)',
    borderColor: Colors.textDisabled,
  },
  currentPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  nodeCard: {
    ...Glass.panel,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    marginLeft: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  nodeCardCurrent: {
    borderColor: 'rgba(142, 161, 188, 0.45)',
    ...Shadows.glow,
  },
  nodeCardLocked: {
    opacity: 0.5,
    borderColor: 'rgba(62, 74, 102, 0.2)',
  },
  nodeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 161, 188, 0.06)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeIconCurrent: {
    borderColor: 'rgba(142, 161, 188, 0.3)',
    backgroundColor: 'rgba(142, 161, 188, 0.1)',
  },
  nodeTextArea: {
    flex: 1,
  },
  nodeTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  nodeLocked: {
    color: Colors.textDisabled,
  },
  nodeSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  xpBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(142, 161, 188, 0.08)',
  },
  xpText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
});
