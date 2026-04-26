import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Typography, Spacing, BorderRadius, Glass } from '@/constants/Theme';

const { width } = Dimensions.get('window');
const CARD_W = (width - Spacing.xl * 2 - Spacing.md) / 2;

const ITEMS = [
  { icon: 'flask-outline' as const, title: 'Home Remedies', sub: 'Natural skincare', count: 24, color: '#22C55E' },
  { icon: 'barbell-outline' as const, title: 'Calisthenics', sub: 'Workout PDFs', count: 12, color: '#8ea1bc' },
  { icon: 'body-outline' as const, title: 'Posture Guide', sub: 'Fix posture in 30d', count: 8, color: '#5CE1E6' },
  { icon: 'people-outline' as const, title: 'Social Mastery', sub: 'Introvert → Extrovert', count: 16, color: '#7B2CBF' },
  { icon: 'heart-outline' as const, title: 'Flirting 101', sub: 'Confidence tips', count: 10, color: '#EF4444' },
  { icon: 'eye-outline' as const, title: 'Mewing & Facial', sub: 'Jawline exercises', count: 14, color: '#F59E0B' },
];

export default function VaultScreen() {
  return (
    <View style={s.container}>
      <LinearGradient colors={Gradients.heroBackground as any} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>The Vault</Text>
        <Text style={s.sub}>Your knowledge library & resources</Text>
        <View style={s.search}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <Text style={s.searchTxt}>Search resources…</Text>
        </View>
        <View style={s.grid}>
          {ITEMS.map((it, i) => (
            <TouchableOpacity key={i} style={s.card} activeOpacity={0.75} id={`vault-${i}`}>
              <View style={[s.iconWrap, { borderColor: `${it.color}30` }]}>
                <Ionicons name={it.icon} size={24} color={it.color} />
              </View>
              <Text style={s.cardTitle}>{it.title}</Text>
              <Text style={s.cardSub}>{it.sub}</Text>
              <View style={s.cardFoot}>
                <Text style={[s.cnt, { color: it.color }]}>{it.count} items</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.textDisabled} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingTop: 60, paddingHorizontal: Spacing.xl },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, letterSpacing: 1 },
  sub: { fontSize: Typography.sizes.sm, color: Colors.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  search: { ...Glass.input, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.xl },
  searchTxt: { fontSize: Typography.sizes.md, color: Colors.textDisabled },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  card: { ...Glass.panel, width: CARD_W, padding: Spacing.base },
  iconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(142,161,188,0.04)', borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  cardTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, marginBottom: 3 },
  cardSub: { fontSize: Typography.sizes.xs, color: Colors.textMuted, lineHeight: 16, marginBottom: Spacing.md },
  cardFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cnt: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, letterSpacing: 0.5 },
});
