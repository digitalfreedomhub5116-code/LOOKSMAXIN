import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';

export interface QuickAction {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
}

interface QuickActionGridProps {
  actions: QuickAction[];
  onActionPress?: (action: QuickAction, index: number) => void;
}

/**
 * QuickActionGrid — 2×2 glassmorphic pill buttons
 *
 * Uses explicit 2-column rows to guarantee the 2×2 layout.
 * Each pill uses BlurView (dark tint) with a 1px #8ea1bc @30% border.
 */
export default function QuickActionGrid({ actions, onActionPress }: QuickActionGridProps) {
  // Split actions into rows of 2
  const rows: QuickAction[][] = [];
  for (let i = 0; i < actions.length; i += 2) {
    rows.push(actions.slice(i, i + 2));
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((action, colIdx) => {
            const globalIdx = rowIdx * 2 + colIdx;
            return (
              <TouchableOpacity
                key={globalIdx}
                activeOpacity={0.7}
                onPress={() => onActionPress?.(action, globalIdx)}
                style={styles.pill}
                id={`quick-action-${globalIdx}`}
              >
                {/* Blur Background */}
                <BlurView
                  intensity={Platform.OS === 'web' ? 0 : 40}
                  tint="dark"
                  style={styles.blurFill}
                />

                {/* Fallback fill for web / low-blur devices */}
                <View style={styles.fallbackFill} />

                {/* Content */}
                <View style={styles.pillContent}>
                  <View style={[styles.iconCircle, { borderColor: `${action.color}30` }]}>
                    <Ionicons name={action.icon} size={16} color={action.color} />
                  </View>
                  <Text
                    style={styles.label}
                    numberOfLines={1}
                  >
                    {action.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pill: {
    flex: 1,
    height: 50,
    borderRadius: BorderRadius.lg, // 16px
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(142, 161, 188, 0.30)', // #8ea1bc at 30%
  },
  blurFill: {
    ...StyleSheet.absoluteFillObject,
  },
  fallbackFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 20, 48, 0.72)',
  },
  pillContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    zIndex: 1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    backgroundColor: 'rgba(142, 161, 188, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  label: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
});
