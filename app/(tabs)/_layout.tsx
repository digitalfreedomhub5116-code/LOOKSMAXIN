import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Shadows, Spacing } from '@/constants/Theme';

const { width } = Dimensions.get('window');

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Custom center tab button – elevated gradient orb for the Lynx AI Chat
 */
function CenterTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.centerButtonOuter}>
      <View style={[styles.centerGlowRing, focused && styles.centerGlowRingActive]} />
      <LinearGradient
        colors={focused ? ['#8ea1bc', '#7B2CBF'] : ['rgba(142,161,188,0.3)', 'rgba(123,44,191,0.25)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.centerButton}
      >
        <Ionicons
          name="sparkles"
          size={26}
          color={focused ? '#FFFFFF' : Colors.textSecondary}
        />
      </LinearGradient>
    </View>
  );
}

/**
 * Tab icon component with active indicator dot
 */
function TabIcon({ name, focused, color }: { name: IoniconsName; focused: boolean; color: string }) {
  return (
    <View style={styles.tabIconContainer}>
      <Ionicons name={name} size={22} color={color} />
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="grid-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="roadmap"
        options={{
          title: 'Roadmap',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="map-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lynx-chat"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <CenterTabIcon focused={focused} />,
          tabBarLabelStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="library-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="person-outline" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 68;
const CENTER_BTN_SIZE = 58;

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT,
    backgroundColor: Colors.tabBarBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.tabBarBorder,
    paddingTop: Spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.sm,
    elevation: 0, // Remove Android default shadow
  },
  tabItem: {
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 4,
    ...Shadows.glow,
  },
  centerButtonOuter: {
    width: CENTER_BTN_SIZE + 16,
    height: CENTER_BTN_SIZE + 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -30, // Float above the tab bar
  },
  centerGlowRing: {
    position: 'absolute',
    width: CENTER_BTN_SIZE + 14,
    height: CENTER_BTN_SIZE + 14,
    borderRadius: (CENTER_BTN_SIZE + 14) / 2,
    backgroundColor: 'rgba(142, 161, 188, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(142, 161, 188, 0.12)',
  },
  centerGlowRingActive: {
    backgroundColor: 'rgba(142, 161, 188, 0.15)',
    borderColor: 'rgba(142, 161, 188, 0.35)',
    ...Shadows.glow,
  },
  centerButton: {
    width: CENTER_BTN_SIZE,
    height: CENTER_BTN_SIZE,
    borderRadius: CENTER_BTN_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(142, 161, 188, 0.3)',
    ...Shadows.glow,
  },
});
