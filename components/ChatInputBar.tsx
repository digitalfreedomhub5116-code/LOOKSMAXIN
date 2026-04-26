import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Theme';

interface ChatInputBarProps {
  onSend?: (text: string) => void;
  onMicPress?: () => void;
  onPlusPress?: () => void;
}

/**
 * ChatInputBar — Fixed bottom input with glassmorphic blur.
 *
 * Layout: [ + ] [ ──── text input ──── ] [ 🎙 ]
 *
 * Uses BlurView with dark tint for the container.
 * The text field sits in a slightly darker inset.
 * Mic button is a solid Lynx Blue circle.
 */
export default function ChatInputBar({ onSend, onMicPress, onPlusPress }: ChatInputBarProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim().length === 0) return;
    onSend?.(text.trim());
    setText('');
  };

  const hasText = text.trim().length > 0;

  return (
    <View style={styles.wrapper}>
      {/* Blur backdrop */}
      <BlurView
        intensity={Platform.OS === 'web' ? 0 : 50}
        tint="dark"
        style={styles.blurBackdrop}
      />
      {/* Fallback solid fill */}
      <View style={styles.fallbackFill} />

      {/* Top border line */}
      <View style={styles.topBorder} />

      {/* Input row */}
      <View style={styles.inputRow}>
        {/* Plus button */}
        <TouchableOpacity
          style={styles.plusButton}
          onPress={onPlusPress}
          activeOpacity={0.7}
          id="chat-plus-button"
        >
          <Ionicons name="add" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Text field inset */}
        <View style={styles.textFieldWrap}>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Ask Lynx anything..."
            placeholderTextColor={Colors.textDisabled}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            id="lynx-chat-input"
          />
        </View>

        {/* Mic / Send button */}
        {hasText ? (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            activeOpacity={0.8}
            id="lynx-send-button"
          >
            <Ionicons name="arrow-up" size={20} color={Colors.background} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.micButton}
            onPress={onMicPress}
            activeOpacity={0.8}
            id="lynx-voice-button"
          >
            <Ionicons name="mic" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const MIC_SIZE = 42;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 90 : 76, // Above tab bar safe area
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  blurBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  fallbackFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 10, 31, 0.88)',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(142, 161, 188, 0.10)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    zIndex: 1,
  },
  plusButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 161, 188, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(142, 161, 188, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textFieldWrap: {
    flex: 1,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(8, 14, 32, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(142, 161, 188, 0.12)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  textInput: {
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
    padding: 0, // Reset native padding
  },
  micButton: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    backgroundColor: Colors.primary, // Solid Lynx Blue
    justifyContent: 'center',
    alignItems: 'center',
    // Subtle glow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  sendButton: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
});
