-- ============================================================================
-- FINAL DATABASE SCHEMA FOR RIHLAT DA'EYAH (رحلة الداعية الصغير)
-- ============================================================================
-- Complete production-ready PostgreSQL / Supabase schema matching current app logic.
-- Includes core tables, constraints, foreign keys, triggers, indexes,
-- and Row Level Security (RLS) policies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS & TRIGGERS FOR TIMESTAMP UPDATES
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. CORE TABLES
-- ----------------------------------------------------------------------------

-- 3.1 TEACHERS
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  teacher_code TEXT UNIQUE,
  avatar_url TEXT,
  school_or_center TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 BATCHES
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  stage TEXT DEFAULT 'المرحلة العامة',
  supervisor_name TEXT,
  description TEXT,
  gender TEXT CHECK (gender IN ('female', 'male', 'mixed')) DEFAULT 'female',
  color_gradient TEXT DEFAULT 'from-teal-600 to-emerald-600',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 CLASSES
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  teacher_name TEXT,
  schedule TEXT,
  room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 STUDENTS
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  student_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  points INT NOT NULL DEFAULT 0 CHECK (points >= 0),
  avatar_url TEXT,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely remove global unique constraint if present
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_student_code_key;
DROP INDEX IF EXISTS public.students_student_code_key;

-- Composite uniqueness per class (for students assigned to a class)
CREATE UNIQUE INDEX IF NOT EXISTS students_class_student_code_idx
ON public.students (class_id, student_code)
WHERE class_id IS NOT NULL;

-- 3.5 CLUBS
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  supervisor_name TEXT,
  category TEXT,
  slogan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.6 CLUB MEMBERS
CREATE TABLE IF NOT EXISTS public.club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(club_id, student_id)
);

-- 3.7 CHALLENGES
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('daily', 'weekly', 'monthly')) DEFAULT 'daily',
  reward_xp INT NOT NULL DEFAULT 50 CHECK (reward_xp >= 0),
  status TEXT NOT NULL CHECK (status IN ('active', 'upcoming', 'completed')) DEFAULT 'active',
  due_date TIMESTAMPTZ,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'batch', 'class', 'club', 'student')) DEFAULT 'all',
  target_id UUID,
  target_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.8 CHALLENGE SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.challenge_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('club', 'challenge', 'achievement', 'regular')) DEFAULT 'challenge',
  source_name TEXT NOT NULL,
  submission_content TEXT NOT NULL,
  reward_xp INT NOT NULL DEFAULT 50 CHECK (reward_xp >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  teacher_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL
);

-- 3.9 POINT TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  points INT NOT NULL,
  reason TEXT NOT NULL,
  category TEXT DEFAULT 'reward' CHECK (category IN ('quran', 'behavior', 'attendance', 'reward', 'challenge')),
  source_type TEXT,
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.10 JOURNEY SETTINGS (BATCH-SPECIFIC STATIONS)
CREATE TABLE IF NOT EXISTS public.journey_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  station_level INT NOT NULL CHECK (station_level >= 1),
  title TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  threshold INT NOT NULL DEFAULT 0 CHECK (threshold >= 0),
  icon TEXT DEFAULT '🌱',
  description TEXT,
  requirements_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(batch_id, station_level)
);

-- 3.11 SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE UNIQUE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  rewards_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  branding_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  leaderboard_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.12 LIBRARY ITEMS
CREATE TABLE IF NOT EXISTS public.library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'video', 'audio', 'image', 'link', 'doc')) DEFAULT 'pdf',
  file_size TEXT,
  duration TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT,
  uploaded_by TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'batch', 'class', 'club', 'student')) DEFAULT 'all',
  target_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.13 TEACHER MESSAGES / ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.teacher_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'المعلم',
  pinned BOOLEAN DEFAULT false,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'batch', 'class', 'club', 'student')) DEFAULT 'all',
  target_id UUID,
  target_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.14 STUDENT NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.student_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.teacher_messages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_batches_teacher_id ON public.batches(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_batch_id ON public.classes(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_batch_id ON public.students(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_student_code ON public.students(student_code);

CREATE INDEX IF NOT EXISTS idx_clubs_batch_id ON public.clubs(batch_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON public.club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_student_id ON public.club_members(student_id);

CREATE INDEX IF NOT EXISTS idx_challenges_batch_id ON public.challenges(batch_id);
CREATE INDEX IF NOT EXISTS idx_challenges_target ON public.challenges(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_submissions_batch_student ON public.challenge_submissions(batch_id, student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.challenge_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge ON public.challenge_submissions(challenge_id);

CREATE INDEX IF NOT EXISTS idx_point_transactions_student ON public.point_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_journey_settings_batch ON public.journey_settings(batch_id);

CREATE INDEX IF NOT EXISTS idx_library_items_batch ON public.library_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_library_items_target ON public.library_items(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_teacher_messages_batch ON public.teacher_messages(batch_id);
CREATE INDEX IF NOT EXISTS idx_teacher_messages_target ON public.teacher_messages(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_student_notifications_student ON public.student_notifications(student_id, is_read);

-- ----------------------------------------------------------------------------
-- 5. TRIGGERS & AUTOMATED LOGIC
-- ----------------------------------------------------------------------------

-- Trigger for auto-updating timestamps
CREATE TRIGGER trg_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_batches_updated_at BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_challenges_updated_at BEFORE UPDATE ON public.challenges FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_journey_settings_updated_at BEFORE UPDATE ON public.journey_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger for automatically updating student's total points when a point transaction is inserted
CREATE OR REPLACE FUNCTION handle_point_transaction_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.students
  SET points = GREATEST(0, points + NEW.points),
      updated_at = NOW()
  WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_point_transaction_inserted
AFTER INSERT ON public.point_transactions
FOR EACH ROW
EXECUTE FUNCTION handle_point_transaction_insert();

-- NOTE: Point transactions for approved submissions are handled explicitly and idempotently
-- in the application layer (teacherService.reviewSubmission) to prevent double counting.
-- Drop legacy submission trigger if it exists:
DROP TRIGGER IF EXISTS trg_submission_approved ON public.challenge_submissions;
DROP FUNCTION IF EXISTS handle_submission_approval();

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- HELPER RLS FUNCTIONS
-- ----------------------------------------------------------------------------

-- Check if current authenticated user is a teacher owning the batch
CREATE OR REPLACE FUNCTION public.is_batch_teacher(p_batch_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.batches
    WHERE id = p_batch_id AND teacher_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Retrieve student code or student ID from JWT claims if available
CREATE OR REPLACE FUNCTION public.current_student_code()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'student_code', '');
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ----------------------------------------------------------------------------
-- RLS POLICIES FOR TEACHERS
-- ----------------------------------------------------------------------------
CREATE POLICY "Teachers can manage their own profile"
  ON public.teachers FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Teachers can manage their own batches"
  ON public.batches FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can manage classes in their batches"
  ON public.classes FOR ALL
  TO authenticated
  USING (public.is_batch_teacher(batch_id))
  WITH CHECK (public.is_batch_teacher(batch_id));

CREATE POLICY "Teachers can manage students in their batches"
  ON public.students FOR ALL
  TO authenticated
  USING (public.is_batch_teacher(batch_id))
  WITH CHECK (public.is_batch_teacher(batch_id));

CREATE POLICY "Teachers can manage clubs in their batches"
  ON public.clubs FOR ALL
  TO authenticated
  USING (public.is_batch_teacher(batch_id))
  WITH CHECK (public.is_batch_teacher(batch_id));

CREATE POLICY "Teachers can manage club members in their batches"
  ON public.club_members FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clubs c WHERE c.id = club_id AND public.is_batch_teacher(c.batch_id)
  ));

CREATE POLICY "Teachers can manage challenges in their batches"
  ON public.challenges FOR ALL
  TO authenticated
  USING (public.is_batch_teacher(batch_id))
  WITH CHECK (public.is_batch_teacher(batch_id));

CREATE POLICY "Teachers can manage submissions in their batches"
  ON public.challenge_submissions FOR ALL
  TO authenticated
  USING (public.is_batch_teacher(batch_id))
  WITH CHECK (public.is_batch_teacher(batch_id));

CREATE POLICY "Teachers can manage point transactions in their batches"
  ON public.point_transactions FOR ALL
  TO authenticated
  USING (batch_id IS NULL OR public.is_batch_teacher(batch_id));

CREATE POLICY "Teachers can manage journey settings in their batches"
  ON public.journey_settings FOR ALL
  TO authenticated
  USING (public.is_batch_teacher(batch_id))
  WITH CHECK (public.is_batch_teacher(batch_id));

CREATE POLICY "Teachers can manage system settings in their batches"
  ON public.system_settings FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid() OR (batch_id IS NOT NULL AND public.is_batch_teacher(batch_id)));

CREATE POLICY "Teachers can manage library items in their batches"
  ON public.library_items FOR ALL
  TO authenticated
  USING (batch_id IS NULL OR public.is_batch_teacher(batch_id));

CREATE POLICY "Teachers can manage messages in their batches"
  ON public.teacher_messages FOR ALL
  TO authenticated
  USING (batch_id IS NULL OR public.is_batch_teacher(batch_id));

-- ----------------------------------------------------------------------------
-- RLS POLICIES FOR STUDENTS (AUTHENTICATED VIA JWT / CUSTOM CLAIMS / CODE)
-- ----------------------------------------------------------------------------

-- Students can read their own profile row
CREATE POLICY "Students can view their own profile"
  ON public.students FOR SELECT
  TO authenticated, anon
  USING (
    student_code = public.current_student_code()
    OR id::text = current_setting('request.jwt.claims', true)::json->>'student_id'
  );

-- Students can read challenges assigned to them or their batch/class/club/everyone
CREATE POLICY "Students can view targeted challenges"
  ON public.challenges FOR SELECT
  TO authenticated, anon
  USING (
    target_type = 'all'
    OR (target_type = 'batch' AND batch_id IN (
      SELECT batch_id FROM public.students WHERE student_code = public.current_student_code()
    ))
    OR (target_type = 'class' AND target_id IN (
      SELECT class_id FROM public.students WHERE student_code = public.current_student_code()
    ))
    OR (target_type = 'club' AND target_id IN (
      SELECT club_id FROM public.club_members cm JOIN public.students s ON cm.student_id = s.id WHERE s.student_code = public.current_student_code()
    ))
    OR (target_type = 'student' AND target_id IN (
      SELECT id FROM public.students WHERE student_code = public.current_student_code()
    ))
  );

-- Students can view their own submissions
CREATE POLICY "Students can view their own submissions"
  ON public.challenge_submissions FOR SELECT
  TO authenticated, anon
  USING (
    student_id IN (SELECT id FROM public.students WHERE student_code = public.current_student_code())
  );

-- Students can insert their own pending submissions
CREATE POLICY "Students can insert their own submissions"
  ON public.challenge_submissions FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE student_code = public.current_student_code())
    AND status = 'pending'
  );

-- Students can view point transactions for themselves
CREATE POLICY "Students can view their own point transactions"
  ON public.point_transactions FOR SELECT
  TO authenticated, anon
  USING (
    student_id IN (SELECT id FROM public.students WHERE student_code = public.current_student_code())
  );

-- Students can view journey settings for their batch
CREATE POLICY "Students can view journey settings for their batch"
  ON public.journey_settings FOR SELECT
  TO authenticated, anon
  USING (
    batch_id IN (SELECT batch_id FROM public.students WHERE student_code = public.current_student_code())
  );

-- Students can view targeted library items
CREATE POLICY "Students can view targeted library items"
  ON public.library_items FOR SELECT
  TO authenticated, anon
  USING (
    target_type = 'all'
    OR (target_type = 'batch' AND batch_id IN (
      SELECT batch_id FROM public.students WHERE student_code = public.current_student_code()
    ))
    OR (target_type = 'class' AND target_id IN (
      SELECT class_id FROM public.students WHERE student_code = public.current_student_code()
    ))
    OR (target_type = 'club' AND target_id IN (
      SELECT club_id FROM public.club_members cm JOIN public.students s ON cm.student_id = s.id WHERE s.student_code = public.current_student_code()
    ))
    OR (target_type = 'student' AND target_id IN (
      SELECT id FROM public.students WHERE student_code = public.current_student_code()
    ))
  );

-- Students can view targeted messages
CREATE POLICY "Students can view targeted messages"
  ON public.teacher_messages FOR SELECT
  TO authenticated, anon
  USING (
    target_type = 'all'
    OR (target_type = 'batch' AND batch_id IN (
      SELECT batch_id FROM public.students WHERE student_code = public.current_student_code()
    ))
    OR (target_type = 'class' AND target_id IN (
      SELECT class_id FROM public.students WHERE student_code = public.current_student_code()
    ))
    OR (target_type = 'club' AND target_id IN (
      SELECT club_id FROM public.club_members cm JOIN public.students s ON cm.student_id = s.id WHERE s.student_code = public.current_student_code()
    ))
    OR (target_type = 'student' AND target_id IN (
      SELECT id FROM public.students WHERE student_code = public.current_student_code()
    ))
  );

-- Students can view and update their notifications (mark as read)
CREATE POLICY "Students can view their notifications"
  ON public.student_notifications FOR SELECT
  TO authenticated, anon
  USING (
    student_id IN (SELECT id FROM public.students WHERE student_code = public.current_student_code())
  );

CREATE POLICY "Students can update their notifications"
  ON public.student_notifications FOR UPDATE
  TO authenticated, anon
  USING (
    student_id IN (SELECT id FROM public.students WHERE student_code = public.current_student_code())
  )
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE student_code = public.current_student_code())
  );

-- ============================================================================
-- 5. RPC FUNCTIONS FOR STUDENT VISIBILITY
-- ============================================================================

-- Security Definer RPC for Student Challenge Visibility
CREATE OR REPLACE FUNCTION public.get_student_challenges(
  p_student_id UUID,
  p_student_code TEXT
)
RETURNS TABLE (
  id UUID,
  batch_id UUID,
  teacher_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  reward_xp INT,
  status TEXT,
  due_date TIMESTAMPTZ,
  target_type TEXT,
  target_id UUID,
  target_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_id UUID;
  v_class_id UUID;
BEGIN
  -- Strict validation: student_code must be provided and non-empty
  IF p_student_id IS NULL OR p_student_code IS NULL OR p_student_code = '' THEN
    RETURN;
  END IF;

  -- 1. Verify student ID + exact student code + active status
  SELECT s.batch_id, s.class_id
  INTO v_batch_id, v_class_id
  FROM public.students s
  WHERE s.id = p_student_id
    AND s.student_code = p_student_code
    AND s.status = 'active';

  -- If student verification fails, return zero rows
  IF v_batch_id IS NULL THEN
    RETURN;
  END IF;

  -- 2. Return authorized challenges for the verified student
  RETURN QUERY
  SELECT 
    c.id,
    c.batch_id,
    c.teacher_id,
    c.title,
    c.description,
    c.category,
    c.reward_xp,
    c.status,
    c.due_date,
    c.target_type,
    c.target_id,
    c.target_name,
    c.created_at
  FROM public.challenges c
  WHERE c.batch_id = v_batch_id
    AND c.status = 'active'
    AND (
      -- 'all': challenge belongs to student's batch
      c.target_type = 'all'
      -- 'batch': target_id equals student's batch_id (or NULL)
      OR (c.target_type = 'batch' AND (c.target_id IS NULL OR c.target_id = v_batch_id))
      -- 'class': target_id equals student's class_id
      OR (c.target_type = 'class' AND v_class_id IS NOT NULL AND c.target_id = v_class_id)
      -- 'club': target_id matches one of the student's club memberships
      OR (c.target_type = 'club' AND EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.student_id = p_student_id
          AND cm.club_id = c.target_id
      ))
      -- 'student': target_id equals student's id
      OR (c.target_type = 'student' AND c.target_id = p_student_id)
    )
  ORDER BY c.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_challenges(UUID, TEXT) TO anon, authenticated;

-- Security Definer RPC for Student Challenge Submission
CREATE OR REPLACE FUNCTION public.submit_student_challenge(
  p_student_id UUID,
  p_student_code TEXT,
  p_challenge_id UUID DEFAULT NULL,
  p_source_type TEXT DEFAULT 'challenge',
  p_source_name TEXT DEFAULT NULL,
  p_submission_content TEXT DEFAULT 'تم تنفيذ التحدي بنجاح'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_id UUID;
  v_reward_xp INT := 50;
  v_challenge_title TEXT;
  v_final_source_name TEXT;
  v_existing_sub_id UUID;
  v_new_sub_id UUID;
BEGIN
  -- 1. Strict identity validation: require non-empty ID and code
  IF p_student_id IS NULL OR p_student_code IS NULL OR TRIM(p_student_code) = '' THEN
    RAISE EXCEPTION 'رمز الطالبة ومعرفها مطلوبان لإرسال التحدي';
  END IF;

  -- 2. Verify student credentials and extract database-assigned batch_id
  SELECT s.batch_id
  INTO v_batch_id
  FROM public.students s
  WHERE s.id = p_student_id
    AND s.student_code = TRIM(p_student_code)
    AND s.status = 'active';

  IF v_batch_id IS NULL THEN
    RAISE EXCEPTION 'تعذر التحقق من هويتك، يرجى تسجيل الدخول مجدداً';
  END IF;

  -- 3. If challenge_id is provided, verify it belongs to the student''s batch and fetch reward_xp
  IF p_challenge_id IS NOT NULL THEN
    SELECT c.reward_xp, c.title
    INTO v_reward_xp, v_challenge_title
    FROM public.challenges c
    WHERE c.id = p_challenge_id
      AND c.batch_id = v_batch_id
      AND c.status = 'active';

    IF v_reward_xp IS NULL THEN
      RAISE EXCEPTION 'التحدي المطلوب غير موجود أو لا ينتمي لدفعتك';
    END IF;
  END IF;

  -- Determine final source name
  v_final_source_name := COALESCE(NULLIF(TRIM(p_source_name), ''), v_challenge_title, 'تحدي');

  -- 4. Idempotency check: prevent duplicate pending submissions for the same student & challenge
  IF p_challenge_id IS NOT NULL THEN
    SELECT cs.id INTO v_existing_sub_id
    FROM public.challenge_submissions cs
    WHERE cs.student_id = p_student_id
      AND cs.challenge_id = p_challenge_id
      AND cs.status = 'pending'
    LIMIT 1;

    IF v_existing_sub_id IS NOT NULL THEN
      -- Already submitted and pending review; return existing ID
      RETURN v_existing_sub_id;
    END IF;
  END IF;

  -- 5. Insert new pending submission into public.challenge_submissions
  INSERT INTO public.challenge_submissions (
    batch_id,
    challenge_id,
    student_id,
    source_type,
    source_name,
    submission_content,
    reward_xp,
    status,
    submitted_at
  ) VALUES (
    v_batch_id,
    p_challenge_id,
    p_student_id,
    COALESCE(p_source_type, 'challenge'),
    v_final_source_name,
    COALESCE(NULLIF(TRIM(p_submission_content), ''), 'تم تنفيذ التحدي بنجاح'),
    COALESCE(v_reward_xp, 50),
    'pending',
    NOW()
  )
  RETURNING id INTO v_new_sub_id;

  RETURN v_new_sub_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_student_challenge(UUID, TEXT, UUID, TEXT, TEXT, TEXT) TO anon, authenticated;


