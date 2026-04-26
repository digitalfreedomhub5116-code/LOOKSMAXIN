import { Play } from 'lucide-react';

interface Exercise {
  title: string;
  duration: string;
  level: string;
  emoji: string;
}

interface ExerciseGroup {
  category: string;
  exercises: Exercise[];
}

const EXERCISE_DATA: ExerciseGroup[] = [
  {
    category: 'Jawline',
    exercises: [
      { title: 'Mewing Basics', duration: '5 min', level: 'Beginner', emoji: '🦴' },
      { title: 'Jaw Clenching', duration: '3 min', level: 'Beginner', emoji: '💪' },
      { title: 'Chin Tuck Hold', duration: '4 min', level: 'Intermediate', emoji: '🎯' },
      { title: 'Neck Curl', duration: '3 min', level: 'Beginner', emoji: '🏋️' },
    ],
  },
  {
    category: 'Facial',
    exercises: [
      { title: 'Cheek Lifter', duration: '5 min', level: 'Beginner', emoji: '😊' },
      { title: 'Forehead Smooth', duration: '4 min', level: 'Beginner', emoji: '✨' },
      { title: 'Eye Firmer', duration: '3 min', level: 'Beginner', emoji: '👁️' },
      { title: 'Face Yoga Flow', duration: '6 min', level: 'Intermediate', emoji: '🧘' },
    ],
  },
  {
    category: 'Nose',
    exercises: [
      { title: 'Nose Shaping', duration: '4 min', level: 'Intermediate', emoji: '👃' },
      { title: 'Nose Straightener', duration: '3 min', level: 'Intermediate', emoji: '📐' },
      { title: 'Tip Lift', duration: '2 min', level: 'Beginner', emoji: '⬆️' },
    ],
  },
  {
    category: 'Posture',
    exercises: [
      { title: 'Wall Angel', duration: '4 min', level: 'Beginner', emoji: '🧍' },
      { title: 'Thoracic Stretch', duration: '5 min', level: 'Intermediate', emoji: '🔄' },
      { title: 'Chin Retraction', duration: '3 min', level: 'Beginner', emoji: '🎯' },
    ],
  },
];

export default function Exercises() {
  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>Exercises</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Daily facial & posture routines</div>
      </div>

      {/* Exercise Groups */}
      {EXERCISE_DATA.map(group => (
        <div key={group.category} style={{ marginBottom: 28 }}>
          {/* Category header */}
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', marginBottom: 12 }}>
            {group.category}
          </div>

          {/* Exercise cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {group.exercises.map(ex => (
              <div
                key={ex.title}
                className="glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: 'var(--surface-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 26,
                }}>
                  {ex.emoji}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{ex.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ex.duration} · {ex.level}</div>
                </div>

                {/* Play button */}
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'rgba(200,168,78,0.15)',
                  border: '1.5px solid var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Play size={16} color="var(--primary)" fill="var(--primary)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
