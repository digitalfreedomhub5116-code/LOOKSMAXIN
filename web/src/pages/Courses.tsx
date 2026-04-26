import { Lock } from 'lucide-react';

interface Course {
  title: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  lessons: number;
  duration: string;
  image: string;
  locked?: boolean;
}

const COURSES: Course[] = [
  {
    title: 'Mewing Mastery',
    level: 'BEGINNER',
    lessons: 8,
    duration: '2h 10m',
    image: '/courses/mewing.png',
  },
  {
    title: 'Skincare Ascension',
    level: 'INTERMEDIATE',
    lessons: 12,
    duration: '3h 40m',
    image: '/courses/skincare.png',
  },
  {
    title: 'Hairstyle Aesthetics',
    level: 'BEGINNER',
    lessons: 6,
    duration: '1h 30m',
    image: '/courses/hairstyle.png',
  },
  {
    title: 'Body Recomp Lite',
    level: 'INTERMEDIATE',
    lessons: 10,
    duration: '2h 50m',
    image: '/courses/bodyrecomp.png',
  },
  {
    title: 'Posture Protocol',
    level: 'BEGINNER',
    lessons: 7,
    duration: '1h 45m',
    image: '/courses/posture.png',
  },
  {
    title: 'Grooming Guide',
    level: 'ADVANCED',
    lessons: 9,
    duration: '2h 20m',
    image: '/courses/grooming.png',
    locked: true,
  },
];

const levelColor: Record<string, string> = {
  BEGINNER: '#C8A84E',
  INTERMEDIATE: '#C8A84E',
  ADVANCED: '#C8A84E',
};

export default function Courses() {
  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
          Lynxmaxing Courses
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
          Master every aesthetic skill
        </div>
      </div>

      {/* 2-column grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}>
        {COURSES.map(course => (
          <div
            key={course.title}
            style={{
              borderRadius: 14,
              overflow: 'hidden',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'transform 0.15s',
              position: 'relative',
            }}
          >
            {/* Thumbnail */}
            <div style={{ width: '100%', aspectRatio: '4/5', overflow: 'hidden', position: 'relative' }}>
              <img
                src={course.image}
                alt={course.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  filter: course.locked ? 'brightness(0.4)' : 'none',
                }}
              />
              {/* Gradient overlay at bottom of image */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
                background: 'linear-gradient(transparent, var(--surface))',
              }} />
              {/* Lock overlay */}
              {course.locked && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Lock size={20} color="var(--text-muted)" />
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ padding: '10px 12px 14px' }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: levelColor[course.level],
                letterSpacing: 1.2, marginBottom: 4,
              }}>
                {course.level}
              </div>
              <div style={{
                fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4,
                lineHeight: 1.3,
              }}>
                {course.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {course.lessons} lessons · {course.duration}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
