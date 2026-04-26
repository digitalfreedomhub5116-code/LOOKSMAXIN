import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Colors,
  Gradients,
  Typography,
  Spacing,
  BorderRadius,
  Glass,
  Shadows,
} from '@/constants/Theme';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Question Definitions ───
type QuestionType = 'single' | 'multi' | 'scale';

interface Question {
  id: string;
  question: string;
  subtitle?: string;
  type: QuestionType;
  options: string[];
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const QUESTIONS: Question[] = [
  {
    id: 'gender',
    question: 'What is your gender?',
    subtitle: 'This helps us personalize your glow-up plan',
    type: 'single',
    options: ['Male', 'Female', 'Other'],
    icon: 'person-outline',
  },
  {
    id: 'age_range',
    question: 'How old are you?',
    subtitle: 'Different ages need different approaches',
    type: 'single',
    options: ['16–18', '19–22', '23–27', '28–35', '35+'],
    icon: 'calendar-outline',
  },
  {
    id: 'primary_goal',
    question: 'What is your primary goal?',
    subtitle: 'Choose the one that matters most to you',
    type: 'single',
    options: [
      'Improve facial aesthetics',
      'Build better skin',
      'Gain social confidence',
      'Full body transformation',
      'All of the above',
    ],
    icon: 'trophy-outline',
  },
  {
    id: 'skin_concerns',
    question: 'Any skin concerns?',
    subtitle: 'Select all that apply',
    type: 'multi',
    options: ['Acne', 'Dark circles', 'Uneven tone', 'Oily skin', 'Dry skin', 'None'],
    icon: 'sparkles-outline',
  },
  {
    id: 'fitness_level',
    question: 'Current fitness level?',
    subtitle: 'Be honest — we\'ll build from wherever you are',
    type: 'single',
    options: ['Beginner', 'Intermediate', 'Advanced'],
    icon: 'barbell-outline',
  },
  {
    id: 'social_comfort',
    question: 'How comfortable are you socially?',
    subtitle: 'Rate yourself honestly',
    type: 'scale',
    options: ['Very shy', 'Somewhat shy', 'Average', 'Confident', 'Very confident'],
    icon: 'people-outline',
  },
  {
    id: 'commitment',
    question: 'How much time can you commit daily?',
    subtitle: 'Consistency > intensity',
    type: 'single',
    options: ['15 minutes', '30 minutes', '1 hour', '2+ hours'],
    icon: 'time-outline',
  },
];

// ─── Option Button Component ───
function OptionButton({
  label,
  selected,
  onPress,
  index,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  index: number;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.optionButton, selected && styles.optionSelected]}
        onPress={handlePress}
        activeOpacity={0.7}
        id={`option-${index}`}
      >
        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
          {label}
        </Text>
        {selected && (
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={14} color={Colors.background} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Progress Bar Component ───
function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = (current + 1) / total;
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [current]);

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {current + 1} / {total}
      </Text>
    </View>
  );
}

// ─── Main Calibration Screen ───
export default function CalibrationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  // Animations
  const cardFade = useRef(new Animated.Value(1)).current;
  const cardSlide = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  const question = QUESTIONS[currentQ];
  const isLastQuestion = currentQ === QUESTIONS.length - 1;

  // Check if current question has an answer
  const currentAnswer = answers[question.id];
  const hasAnswer =
    currentAnswer !== undefined &&
    (typeof currentAnswer === 'string'
      ? currentAnswer.length > 0
      : currentAnswer.length > 0);

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const animateTransition = (direction: 'next' | 'prev', callback: () => void) => {
    const slideOut = direction === 'next' ? -40 : 40;
    const slideIn = direction === 'next' ? 40 : -40;

    Animated.parallel([
      Animated.timing(cardFade, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: slideOut, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      cardSlide.setValue(slideIn);
      Animated.parallel([
        Animated.timing(cardFade, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  };

  const handleSelectSingle = (option: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
  };

  const handleSelectMulti = (option: string) => {
    setAnswers((prev) => {
      const current = (prev[question.id] as string[]) || [];
      if (option === 'None') return { ...prev, [question.id]: ['None'] };
      const filtered = current.filter((o) => o !== 'None');
      if (filtered.includes(option)) {
        return { ...prev, [question.id]: filtered.filter((o) => o !== option) };
      }
      return { ...prev, [question.id]: [...filtered, option] };
    });
  };

  const handleNext = async () => {
    if (!hasAnswer) return;
    if (isLastQuestion) {
      // Save all answers to Supabase
      try {
        if (user) {
          const upserts = Object.entries(answers).map(([questionId, answer]) => ({
            user_id: user.id,
            question_id: questionId,
            answer: JSON.stringify(answer),
          }));

          await supabase
            .from('calibration_answers')
            .upsert(upserts, { onConflict: 'user_id,question_id' });

          // Also update profile with gender & age
          await supabase
            .from('profiles')
            .update({
              gender: answers.gender as string,
              age_range: answers.age_range as string,
            })
            .eq('id', user.id);
        }
      } catch (e) {
        console.warn('Failed to save calibration:', e);
      }

      router.push('/face-scan');
      return;
    }
    animateTransition('next', () => setCurrentQ((q) => q + 1));
  };

  const handleBack = () => {
    if (currentQ === 0) {
      router.back();
      return;
    }
    animateTransition('prev', () => setCurrentQ((q) => q - 1));
  };

  const isSelected = (option: string): boolean => {
    const answer = answers[question.id];
    if (!answer) return false;
    if (typeof answer === 'string') return answer === option;
    return answer.includes(option);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...Gradients.heroBackground]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ─── Header ─── */}
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          id="calibration-back"
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Calibration</Text>
        </View>

        <View style={styles.headerRight}>
          {currentQ < QUESTIONS.length - 1 && (
            <TouchableOpacity
              onPress={() => {
                // Skip all and go to face scan
                router.push('/face-scan');
              }}
              id="calibration-skip"
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* ─── Progress Bar ─── */}
      <ProgressBar current={currentQ} total={QUESTIONS.length} />

      {/* ─── Question Card ─── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.questionArea,
            {
              opacity: cardFade,
              transform: [{ translateX: cardSlide }],
            },
          ]}
        >
          {/* Icon Badge */}
          <View style={styles.questionIconWrap}>
            <Ionicons name={question.icon} size={24} color={Colors.primary} />
          </View>

          {/* Question Text */}
          <Text style={styles.questionText}>{question.question}</Text>
          {question.subtitle && (
            <Text style={styles.questionSubtitle}>{question.subtitle}</Text>
          )}

          {/* Type hint for multi-select */}
          {question.type === 'multi' && (
            <View style={styles.multiHint}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.multiHintText}>Select multiple</Text>
            </View>
          )}

          {/* Options */}
          <View style={styles.optionsGrid}>
            {question.options.map((option, i) => (
              <OptionButton
                key={option}
                label={option}
                selected={isSelected(option)}
                index={i}
                onPress={() =>
                  question.type === 'multi'
                    ? handleSelectMulti(option)
                    : handleSelectSingle(option)
                }
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* ─── Bottom CTA ─── */}
      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={[styles.nextButton, !hasAnswer && styles.nextButtonDisabled]}
          activeOpacity={hasAnswer ? 0.85 : 1}
          onPress={handleNext}
          id="calibration-next"
        >
          <LinearGradient
            colors={
              hasAnswer
                ? ['#8ea1bc', '#6B8AAE']
                : ['rgba(142,161,188,0.15)', 'rgba(142,161,188,0.10)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextGradient}
          >
            <Text
              style={[styles.nextText, !hasAnswer && styles.nextTextDisabled]}
            >
              {isLastQuestion ? 'START FACE SCAN' : 'CONTINUE'}
            </Text>
            <Ionicons
              name={isLastQuestion ? 'scan-outline' : 'arrow-forward'}
              size={18}
              color={hasAnswer ? Colors.background : Colors.textDisabled}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ─── Header ───
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 161, 188, 0.08)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
    letterSpacing: 0.3,
  },

  // ─── Progress ───
  progressContainer: {
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(142, 161, 188, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.semibold,
    letterSpacing: 0.5,
    minWidth: 32,
    textAlign: 'right',
  },

  // ─── Question Area ───
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  questionArea: {
    alignItems: 'center',
  },
  questionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 161, 188, 0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.glow,
  },
  questionText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 30,
    marginBottom: Spacing.sm,
  },
  questionSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  multiHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(142, 161, 188, 0.06)',
  },
  multiHintText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },

  // ─── Options ───
  optionsGrid: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  optionButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(142, 161, 188, 0.04)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  optionSelected: {
    backgroundColor: 'rgba(142, 161, 188, 0.12)',
    borderColor: Colors.primary,
    ...Shadows.glow,
  },
  optionText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    flex: 1,
  },
  optionTextSelected: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Bottom ───
  bottomArea: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? Spacing['3xl'] : Spacing.xl,
    paddingTop: Spacing.md,
  },
  nextButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  nextButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
  },
  nextText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.background,
    letterSpacing: 2,
  },
  nextTextDisabled: {
    color: Colors.textDisabled,
  },
});
