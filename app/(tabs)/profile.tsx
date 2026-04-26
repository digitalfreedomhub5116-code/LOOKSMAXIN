import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Typography, Spacing, BorderRadius, Glass, Shadows } from '@/constants/Theme';

const MENU = [
  { icon: 'scan-outline' as const, label: 'Scan History', badge: '3' },
  { icon: 'stats-chart-outline' as const, label: 'Progress Analytics', badge: null },
  { icon: 'trophy-outline' as const, label: 'Achievements', badge: '2 new' },
  { icon: 'settings-outline' as const, label: 'Settings', badge: null },
  { icon: 'help-circle-outline' as const, label: 'Help & Support', badge: null },
];

export default function ProfileScreen() {
  return (
    <View style={s.container}>
      <LinearGradient colors={Gradients.heroBackground as any} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={s.avatarArea}>
          <View style={s.avatarRing}>
            <View style={s.avatar}>
              <Ionicons name="person" size={36} color={Colors.primary} />
            </View>
          </View>
          <Text style={s.name}>Champion</Text>
          <Text style={s.handle}>@champion • Level 4</Text>
          <View style={s.statsRow}>
            <View style={s.stat}><Text style={s.statVal}>82</Text><Text style={s.statLbl}>Score</Text></View>
            <View style={s.divider} />
            <View style={s.stat}><Text style={s.statVal}>7</Text><Text style={s.statLbl}>Streak</Text></View>
            <View style={s.divider} />
            <View style={s.stat}><Text style={s.statVal}>14d</Text><Text style={s.statLbl}>Active</Text></View>
          </View>
        </View>

        {/* Menu */}
        {MENU.map((item, i) => (
          <TouchableOpacity key={i} style={s.menuItem} activeOpacity={0.75} id={`profile-menu-${i}`}>
            <View style={s.menuIcon}>
              <Ionicons name={item.icon} size={20} color={Colors.primary} />
            </View>
            <Text style={s.menuLabel}>{item.label}</Text>
            {item.badge && (
              <View style={s.badge}><Text style={s.badgeText}>{item.badge}</Text></View>
            )}
            <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
          </TouchableOpacity>
        ))}

        {/* Logout */}
        <TouchableOpacity style={s.logout} id="logout-button">
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingTop: 60, paddingHorizontal: Spacing.xl },
  avatarArea: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  avatarRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.base, ...Shadows.glow,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(142,161,188,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  name: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, letterSpacing: 0.5 },
  handle: { fontSize: Typography.sizes.sm, color: Colors.textMuted, marginTop: Spacing.xs },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    marginTop: Spacing.lg, ...Glass.panel, padding: Spacing.base, width: '100%',
  },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  statLbl: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 2 },
  divider: { width: 1, height: 28, backgroundColor: Colors.borderSubtle },
  menuItem: {
    ...Glass.panel, flexDirection: 'row', alignItems: 'center',
    padding: Spacing.base, marginBottom: Spacing.md, gap: Spacing.md,
  },
  menuIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(142,161,188,0.06)', borderWidth: 1,
    borderColor: Colors.borderSubtle, justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { flex: 1, fontSize: Typography.sizes.md, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, backgroundColor: 'rgba(142,161,188,0.12)' },
  badgeText: { fontSize: Typography.sizes.xs, color: Colors.primary, fontWeight: Typography.weights.semibold },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginTop: Spacing.xl, paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  logoutText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.error },
});
