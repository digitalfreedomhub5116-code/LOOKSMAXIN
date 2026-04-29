-- ══════════════════════════════════════════════════
-- Lynx AI — COMPLETE Database Setup (Pro Plan)
-- Paste this ENTIRE script in Supabase SQL Editor and hit RUN
-- ══════════════════════════════════════════════════

-- 1. PROFILES — Extended user info (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  gender TEXT,
  age_range TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CALIBRATION_ANSWERS — Onboarding questionnaire responses
CREATE TABLE public.calibration_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  answer JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- 3. DAILY_TASKS — Habit tracking items
CREATE TABLE public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  scheduled_time TIME,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. FACE_SCANS — AI analysis results
CREATE TABLE public.face_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_score NUMERIC(4,1),
  analysis JSONB,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ROADMAP_NODES — Gamified skill progression
CREATE TABLE public.roadmap_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_unlocked BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  xp_reward INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. CHAT_MESSAGES — Lynx AI conversation history
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. USER_STATS — Aggregated progress metrics
CREATE TABLE public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  lynx_score INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  scans_done INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. LYNX_USER_DATA — Cross-device sync storage
CREATE TABLE public.lynx_user_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  latest_scores JSONB,
  face_url TEXT,
  scan_history JSONB DEFAULT '[]'::jsonb,
  plan_progress JSONB DEFAULT '{}'::jsonb,
  chat_history JSONB DEFAULT '[]'::jsonb,
  saved_remedies JSONB DEFAULT '[]'::jsonb,
  field_updated_at JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. LEADERBOARD — Public streak rankings
CREATE TABLE public.leaderboard (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Player',
  avatar_url TEXT,
  streak INTEGER DEFAULT 0,
  equipped_border TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════
CREATE INDEX idx_calibration_user ON public.calibration_answers(user_id);
CREATE INDEX idx_daily_tasks_user_date ON public.daily_tasks(user_id, date);
CREATE INDEX idx_face_scans_user ON public.face_scans(user_id, created_at DESC);
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id, created_at DESC);
CREATE INDEX idx_roadmap_user ON public.roadmap_nodes(user_id, sort_order);

-- ══════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calibration_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lynx_user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users own calibration" ON public.calibration_answers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own tasks" ON public.daily_tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own scans" ON public.face_scans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own roadmap" ON public.roadmap_nodes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own chat" ON public.chat_messages
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own stats" ON public.user_stats
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own sync data" ON public.lynx_user_data
  FOR ALL USING (auth.uid() = user_id);

-- Leaderboard: anyone can READ, only own row can be modified
CREATE POLICY "Leaderboard is public" ON public.leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Users manage own leaderboard entry" ON public.leaderboard
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own leaderboard entry" ON public.leaderboard
  FOR UPDATE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════
-- AUTO-CREATE profile + stats on signup
-- ══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Champion'));

  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();