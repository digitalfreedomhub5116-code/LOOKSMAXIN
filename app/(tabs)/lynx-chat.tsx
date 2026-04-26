import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/Theme';
import LynxBlob from '@/components/LynxBlob';
import QuickActionGrid, { QuickAction } from '@/components/QuickActionGrid';
import ChatInputBar from '@/components/ChatInputBar';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Quick action definitions ───
const QUICK_ACTIONS: QuickAction[] = [
  { icon: 'scan-outline',        label: 'Analyze Face',       color: Colors.primary },
  { icon: 'sunny-outline',       label: 'Daily Routine',      color: Colors.accent },
  { icon: 'chatbubbles-outline', label: 'Social Simulation',  color: Colors.secondary },
  { icon: 'barbell-outline',     label: 'Calisthenics Guide', color: '#F59E0B' },
];

export default function LynxChatScreen() {
  // ─── Entrance animations ───
  const headerFade    = useRef(new Animated.Value(0)).current;
  const headerSlideY  = useRef(new Animated.Value(-20)).current;
  const blobFade      = useRef(new Animated.Value(0)).current;
  const blobScale     = useRef(new Animated.Value(0.6)).current;
  const statusFade    = useRef(new Animated.Value(0)).current;
  const gridFade      = useRef(new Animated.Value(0)).current;
  const gridSlideY    = useRef(new Animated.Value(30)).current;
  const inputFade     = useRef(new Animated.Value(0)).current;
  const inputSlideY   = useRef(new Animated.Value(20)).current;

  // Ambient radial glow behind the blob
  const radialPulse   = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    // Staggered entrance sequence
    Animated.stagger(150, [
      // 1. Header slides down & fades in
      Animated.parallel([
        Animated.timing(headerFade, {
          toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(headerSlideY, {
          toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]),
      // 2. Blob pops in
      Animated.parallel([
        Animated.timing(blobFade, {
          toValue: 1, duration: 500, useNativeDriver: true,
        }),
        Animated.spring(blobScale, {
          toValue: 1, friction: 6, tension: 50, useNativeDriver: true,
        }),
      ]),
      // 3. Status text
      Animated.timing(statusFade, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
      // 4. Quick actions grid
      Animated.parallel([
        Animated.timing(gridFade, {
          toValue: 1, duration: 500, useNativeDriver: true,
        }),
        Animated.timing(gridSlideY, {
          toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]),
      // 5. Input bar
      Animated.parallel([
        Animated.timing(inputFade, {
          toValue: 1, duration: 400, useNativeDriver: true,
        }),
        Animated.timing(inputSlideY, {
          toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous radial glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(radialPulse, {
          toValue: 0.45, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
        Animated.timing(radialPulse, {
          toValue: 0.15, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const handleActionPress = (action: QuickAction, index: number) => {
    // TODO: Route to respective feature
    console.log('Quick action pressed:', action.label);
  };

  const handleSend = (text: string) => {
    // TODO: Send to Lynx AI backend
    console.log('Message sent:', text);
  };

  return (
    <View style={styles.container}>
      {/* ─── Background ─── */}
      <View style={styles.bg} />

      {/* ─── Ambient radial glow (behind blob) ─── */}
      <Animated.View style={[styles.radialGlow, { opacity: radialPulse }]} />

      {/* ─── Subtle grid pattern ─── */}
      <View style={styles.gridPattern}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineH, { top: `${i * 10}%` as any }]} />
        ))}
      </View>

      {/* ─── Header ─── */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerFade,
            transform: [{ translateY: headerSlideY }],
          },
        ]}
      >
        <View style={styles.headerTextArea}>
          <Text style={styles.greeting}>Hello, Champion</Text>
          <Text style={styles.subtitle}>How can I help you level up today?</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.headerIconBtn}>
            <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
          </View>
        </View>
      </Animated.View>

      {/* ─── Center Content (Blob + Status + Quick Actions) ─── */}
      <View style={styles.centerContent}>
        {/* Blob */}
        <Animated.View
          style={[
            styles.blobWrap,
            {
              opacity: blobFade,
              transform: [{ scale: blobScale }],
            },
          ]}
        >
          <LynxBlob size={120} />
        </Animated.View>

        {/* Status indicator */}
        <Animated.View style={[styles.statusRow, { opacity: statusFade }]}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Online</Text>
          <View style={styles.statusSep} />
          <Text style={styles.statusText}>Ready to assist</Text>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          style={{
            opacity: gridFade,
            transform: [{ translateY: gridSlideY }],
          }}
        >
          <QuickActionGrid
            actions={QUICK_ACTIONS}
            onActionPress={handleActionPress}
          />
        </Animated.View>
      </View>

      {/* ─── Bottom Input Bar ─── */}
      <Animated.View
        style={[
          styles.inputBarWrap,
          {
            opacity: inputFade,
            transform: [{ translateY: inputSlideY }],
          },
        ]}
      >
        <ChatInputBar
          onSend={handleSend}
          onMicPress={() => console.log('Mic pressed')}
          onPlusPress={() => console.log('Plus pressed')}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1128', // Solid midnight blue as specified
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A1128',
  },

  // ─── Ambient glow ───
  radialGlow: {
    position: 'absolute',
    top: SCREEN_H * 0.18,
    alignSelf: 'center',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(123, 44, 191, 0.14)',
  },

  // ─── Grid pattern ───
  gridPattern: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(142, 161, 188, 0.025)',
  },

  // ─── Header ───
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 62,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    zIndex: 2,
  },
  headerTextArea: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary, // #D0D6E0 icy grey
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 161, 188, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(142, 161, 188, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Center content ───
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    paddingBottom: 130, // Clear input bar + tab bar
  },
  blobWrap: {
    marginBottom: Spacing.md,
  },

  // ─── Status ───
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.success,
    // Green glow
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    fontWeight: Typography.weights.medium,
  },
  statusSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textDisabled,
  },

  // ─── Input bar wrapper ───
  inputBarWrap: {
    zIndex: 10,
  },
});
