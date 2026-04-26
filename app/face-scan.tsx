import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
  Platform, ScrollView, Dimensions, Image, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Gradients, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { analyzeFace, saveFaceScan, type FaceScores } from '@/lib/gemini';
import ScannerHUD from '@/components/ScannerHUD';
import ScoreResults from '@/components/ScoreResults';

const { width: SW } = Dimensions.get('window');

type ScreenState = 'camera' | 'analyzing' | 'results';

export default function FaceScanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [screenState, setScreenState] = useState<ScreenState>('camera');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [scores, setScores] = useState<FaceScores | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const cameraRef = useRef<CameraView>(null);

  // Animations
  const shutterScale = useRef(new Animated.Value(1)).current;
  const analyzeOpacity = useRef(new Animated.Value(0)).current;
  const analyzePulse = useRef(new Animated.Value(0.4)).current;
  const resultsSlide = useRef(new Animated.Value(80)).current;
  const resultsOpacity = useRef(new Animated.Value(0)).current;

  const handleCapture = async () => {
    setErrorMsg('');

    // Shutter press animation
    Animated.sequence([
      Animated.timing(shutterScale, { toValue: 0.85, duration: 80, useNativeDriver: false }),
      Animated.spring(shutterScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: false }),
    ]).start();

    let base64Data: string | undefined;
    let photoUri: string | undefined;

    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: true });
        if (photo) {
          photoUri = photo.uri;
          setCapturedUri(photo.uri);

          // Use base64 from camera if available (native), otherwise convert blob (web)
          if (photo.base64) {
            base64Data = photo.base64;
          } else if (photo.uri) {
            // Web fallback: fetch the blob and convert to base64
            try {
              const resp = await fetch(photo.uri);
              const blob = await resp.blob();
              base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const result = reader.result as string;
                  // Strip data:image/...;base64, prefix
                  const b64 = result.split(',')[1];
                  resolve(b64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            } catch (convErr) {
              console.warn('Base64 conversion error:', convErr);
            }
          }
        }
      } catch (e) {
        console.warn('Camera capture error:', e);
      }
    }

    if (!base64Data) {
      setErrorMsg('Failed to capture photo. Please try again.');
      return;
    }

    // Transition to analyzing
    setScreenState('analyzing');
    analyzeOpacity.setValue(0);
    Animated.timing(analyzeOpacity, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(analyzePulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(analyzePulse, { toValue: 0.4, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    ).start();

    // Call Gemini API
    try {
      const result = await analyzeFace(base64Data, 'image/jpeg');
      setScores(result);

      // Save to Supabase
      if (user) {
        try { await saveFaceScan(user.id, result); } catch {}
      }

      // Transition to results
      setScreenState('results');
      Animated.parallel([
        Animated.timing(resultsOpacity, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(resultsSlide, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      ]).start();
    } catch (e: any) {
      setErrorMsg(e.message || 'Analysis failed. Please try again.');
      setScreenState('camera');
    }
  };

  // ─── Permission screens ───
  if (!permission) {
    return (
      <View style={styles.permScreen}>
        <LinearGradient colors={[...Gradients.heroBackground]} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permScreen}>
        <LinearGradient colors={[...Gradients.heroBackground]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.permBox}>
          <View style={styles.permIcon}>
            <Ionicons name="camera-outline" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.permTitle}>Camera Access</Text>
          <Text style={styles.permSub}>Lynx AI needs camera access to analyze your facial features</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <LinearGradient colors={['#8ea1bc', '#6B8AAE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.permGrad}>
              <Text style={styles.permBtnText}>GRANT ACCESS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ═══════════ CAMERA ═══════════
  if (screenState === 'camera') {
    return (
      <View style={styles.camera}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="front" />
        <View style={styles.vignette} />
        <ScannerHUD />

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>FACE SCAN</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Instruction */}
        <View style={styles.instrWrap}>
          <Text style={styles.instrText}>Position your face within the frame</Text>
        </View>

        {/* Error toast */}
        {errorMsg ? (
          <View style={styles.errToast}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Capture panel */}
        <View style={styles.capturePanel}>
          <BlurView intensity={40} tint="dark" style={styles.capturePanelInner}>
            <Animated.View style={{ transform: [{ scale: shutterScale }] }}>
              <TouchableOpacity style={styles.shutterOuter} onPress={handleCapture} activeOpacity={0.8}>
                <View style={styles.shutterInner}>
                  <View style={styles.shutterCore} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </BlurView>
        </View>
      </View>
    );
  }

  // ═══════════ ANALYZING ═══════════
  if (screenState === 'analyzing') {
    return (
      <View style={styles.analyzeScreen}>
        <LinearGradient colors={[...Gradients.heroBackground]} style={StyleSheet.absoluteFillObject} />
        <Animated.View style={[styles.analyzeContent, { opacity: analyzeOpacity }]}>
          <Animated.View style={[styles.pulseRing, { opacity: analyzePulse }]}>
            <View style={styles.pulseInner}>
              <Ionicons name="scan" size={36} color={Colors.primary} />
            </View>
          </Animated.View>
          <Text style={styles.analyzeTitle}>Analyzing Your Features</Text>
          <Text style={styles.analyzeSub}>AI is mapping facial structure…</Text>
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((i) => (
              <Animated.View key={i} style={[styles.dot, { opacity: analyzePulse }]} />
            ))}
          </View>
        </Animated.View>
      </View>
    );
  }

  // ═══════════ RESULTS ═══════════
  const metrics = scores ? [
    { label: 'Jawline',         score: scores.jawline,          color: '#8ea1bc' },
    { label: 'Skin Quality',    score: scores.skin_quality,     color: '#5CE1E6' },
    { label: 'Eyes',            score: scores.eyes,             color: '#8ea1bc' },
    { label: 'Lips',            score: scores.lips,             color: '#7B2CBF' },
    { label: 'Facial Symmetry', score: scores.facial_symmetry,  color: '#5CE1E6' },
    { label: 'Hair Quality',    score: scores.hair_quality,     color: '#8ea1bc' },
  ] : [];

  return (
    <View style={styles.resultsScreen}>
      <LinearGradient colors={[...Gradients.heroBackground]} style={StyleSheet.absoluteFillObject} />

      <View style={styles.resultsHeader}>
        <TouchableOpacity style={styles.topBtn} onPress={() => { setScreenState('camera'); resultsOpacity.setValue(0); resultsSlide.setValue(80); }}>
          <Ionicons name="refresh-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.resultsTitle}>Your Analysis</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.resultsScroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: resultsOpacity, transform: [{ translateY: resultsSlide }] }}>
          {/* Photo */}
          <View style={styles.photoWrap}>
            {capturedUri ? (
              <Image source={{ uri: capturedUri }} style={styles.photoImg} resizeMode="cover" />
            ) : (
              <View style={styles.photoPlaceholder}><Ionicons name="person" size={40} color={Colors.textMuted} /></View>
            )}
          </View>

          {/* Scores */}
          {scores && (
            <ScoreResults metrics={metrics} overallScore={scores.overall} potentialGain={scores.potential} />
          )}

          {/* Tips */}
          {scores?.tips && scores.tips.length > 0 && (
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>AI Improvement Tips</Text>
              {scores.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons name="sparkles" size={14} color={Colors.primary} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={() => router.replace('/(tabs)')}>
            <LinearGradient colors={['#8ea1bc', '#6B8AAE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGrad}>
              <Text style={styles.ctaText}>CONTINUE TO DASHBOARD</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.background} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.retakeBtn} onPress={() => { setScreenState('camera'); resultsOpacity.setValue(0); resultsSlide.setValue(80); }}>
            <Ionicons name="camera-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.retakeText}>Retake Photo</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Permission
  permScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  permBox: { alignItems: 'center', paddingHorizontal: Spacing['2xl'], gap: Spacing.base },
  permIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(142,161,188,0.08)', borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', ...Shadows.glow },
  permTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, letterSpacing: 1 },
  permSub: { fontSize: Typography.sizes.md, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  permBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', marginTop: Spacing.md, ...Shadows.glow },
  permGrad: { paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.base, alignItems: 'center' },
  permBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.background, letterSpacing: 2 },

  // Camera
  camera: { flex: 1, backgroundColor: '#000' },
  vignette: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,10,31,0.35)' },
  topBar: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 36, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, zIndex: 20 },
  topBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(5,10,31,0.50)', borderWidth: 1, borderColor: Colors.borderSubtle, justifyContent: 'center', alignItems: 'center' },
  topTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.textPrimary, letterSpacing: 3 },
  instrWrap: { position: 'absolute', top: Platform.OS === 'ios' ? 100 : 82, alignSelf: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: 'rgba(5,10,31,0.60)', borderWidth: 1, borderColor: Colors.borderSubtle, zIndex: 20 },
  instrText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontWeight: Typography.weights.medium, letterSpacing: 0.3 },

  // Error
  errToast: { position: 'absolute', top: Platform.OS === 'ios' ? 130 : 110, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', zIndex: 50 },
  errText: { fontSize: Typography.sizes.sm, color: Colors.error, fontWeight: Typography.weights.medium },

  // Capture
  capturePanel: { position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'] },
  capturePanelInner: { paddingTop: Spacing.xl, paddingBottom: Platform.OS === 'ios' ? Spacing['3xl'] : Spacing.xl, borderTopWidth: 1, borderColor: Colors.borderSubtle, alignItems: 'center' },
  shutterOuter: { width: 78, height: 78, borderRadius: 39, borderWidth: 3, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadows.glow },
  shutterInner: { width: 66, height: 66, borderRadius: 33, backgroundColor: 'rgba(142,161,188,0.10)', justifyContent: 'center', alignItems: 'center' },
  shutterCore: { width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.primary },

  // Analyzing
  analyzeScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  analyzeContent: { alignItems: 'center', gap: Spacing.base },
  pulseRing: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg, ...Shadows.glow },
  pulseInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(142,161,188,0.08)', justifyContent: 'center', alignItems: 'center' },
  analyzeTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, letterSpacing: 0.5 },
  analyzeSub: { fontSize: Typography.sizes.md, color: Colors.textMuted },
  dotsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },

  // Results
  resultsScreen: { flex: 1, backgroundColor: Colors.background },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 58 : 40, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  resultsTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary, letterSpacing: 1 },
  resultsScroll: { paddingBottom: Spacing['3xl'] },
  photoWrap: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginBottom: Spacing.xl, borderWidth: 2, borderColor: Colors.border, overflow: 'hidden', ...Shadows.glow },
  photoImg: { width: '100%', height: '100%' },
  photoPlaceholder: { width: '100%', height: '100%', backgroundColor: 'rgba(142,161,188,0.06)', justifyContent: 'center', alignItems: 'center' },

  // Tips
  tipsCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.xl, backgroundColor: 'rgba(15,23,52,0.65)', borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.md },
  tipsTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary, letterSpacing: 0.5, marginBottom: Spacing.xs },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  tipText: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.textSecondary, lineHeight: 20 },

  // CTA
  ctaBtn: { marginHorizontal: Spacing.xl, marginTop: Spacing['2xl'], borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadows.glow },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.base, gap: Spacing.sm },
  ctaText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.background, letterSpacing: 2 },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.lg, paddingVertical: Spacing.md },
  retakeText: { fontSize: Typography.sizes.md, color: Colors.textMuted, fontWeight: Typography.weights.medium },
});
