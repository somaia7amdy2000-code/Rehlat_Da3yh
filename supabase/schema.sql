-- ========================================================
-- مخطط قاعدة بيانات منصة "رحلة داعية" (Rihlat Daeyah)
-- Supabase PostgreSQL Database Schema
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. جدول الملفات الشخصية للمعلمين (Profiles / Teachers)
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    school_or_center TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول الفصول الدراسية (Classes)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    subject TEXT DEFAULT 'القرآن الكريم والتربية الإسلامية',
    academic_year TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول مستويات وأهداف المعلم (Custom Levels)
CREATE TABLE IF NOT EXISTS public.levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE, -- NULL تعني مستوى عام للمعلم
    level_number INT NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    required_points INT NOT NULL CHECK (required_points >= 0),
    reward_description TEXT,
    icon_name TEXT DEFAULT 'award',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول الطلاب (Students)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_number INT NOT NULL,
    full_name TEXT NOT NULL,
    access_code TEXT UNIQUE NOT NULL, -- كود دخول سريع للطالب
    notes TEXT,
    avatar TEXT DEFAULT 'boy-1',
    journey_type TEXT NOT NULL DEFAULT 'tree' CHECK (journey_type IN ('tree', 'car', 'rocket', 'superhero')),
    current_points INT NOT NULL DEFAULT 0,
    current_level_id UUID REFERENCES public.levels(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_number_per_class UNIQUE (class_id, student_number)
);

-- 5. جدول سجل النقاط (Point Transactions)
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    points INT NOT NULL, -- قيمة موجبة للإضافة، وسالبة للخصم
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. جدول إشعارات الطلاب (Student Notifications)
CREATE TABLE IF NOT EXISTS public.student_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'points' CHECK (type IN ('points_add', 'points_deduct', 'level_up', 'reward_earned', 'general')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- الفهارس لتحسين الأداء (Indexes)
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_access_code ON public.students(access_code);
CREATE INDEX IF NOT EXISTS idx_transactions_student ON public.point_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_student ON public.student_notifications(student_id);

-- ========================================================
-- دالة وتريجر لتحديث مجموع نقاط الطالب تلقائياً وإرسال إشعار
-- Trigger function to automatically maintain student points and notify
-- ========================================================
CREATE OR REPLACE FUNCTION public.handle_point_transaction()
RETURNS TRIGGER AS $$
DECLARE
    new_total INT;
    teacher_name TEXT;
BEGIN
    -- 1. حساب مجموع النقاط الحالي للطالب
    SELECT COALESCE(SUM(points), 0) INTO new_total
    FROM public.point_transactions
    WHERE student_id = NEW.student_id;

    -- تجنب النقاط بالسالب
    IF new_total < 0 THEN
        new_total := 0;
    END IF;

    -- 2. تحديث نقاط الطالب
    UPDATE public.students
    SET current_points = new_total,
        updated_at = NOW()
    WHERE id = NEW.student_id;

    -- 3. إنشاء إشعار للطالب
    IF NEW.points > 0 THEN
        INSERT INTO public.student_notifications (student_id, title, message, type)
        VALUES (
            NEW.student_id,
            'حصلت على نقاط جديدة! 🎉',
            'تمت إضافة ' || NEW.points || ' نقطة. السبب: ' || NEW.reason,
            'points_add'
        );
    ELSE
        INSERT INTO public.student_notifications (student_id, title, message, type)
        VALUES (
            NEW.student_id,
            'تنبيه خصم نقاط ⚠️',
            'تم خصم ' || ABS(NEW.points) || ' نقطة. السبب: ' || NEW.reason,
            'points_deduct'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_on_point_transaction
AFTER INSERT ON public.point_transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_point_transaction();

-- ========================================================
-- سياسات الأمان Row Level Security (RLS)
-- ========================================================
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;

-- 1. سياسات المعلم (Teachers)
CREATE POLICY "المعلم يستطيع قراءة وتعديل ملفه الشخصي" ON public.teachers
    FOR ALL USING (auth.uid() = id);

-- 2. سياسات الفصول (Classes)
CREATE POLICY "المعلم يدير فصوله" ON public.classes
    FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "الطلاب يمكنهم قراءة معلومات فصلهم" ON public.classes
    FOR SELECT USING (TRUE);

-- 3. سياسات المستويات (Levels)
CREATE POLICY "المعلم يدير مستوياته" ON public.levels
    FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "الجميع يمكنهم قراءة المستويات" ON public.levels
    FOR SELECT USING (TRUE);

-- 4. سياسات الطلاب (Students)
CREATE POLICY "المعلم يدير طلابه" ON public.students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.classes
            WHERE classes.id = students.class_id
            AND classes.teacher_id = auth.uid()
        )
    );

CREATE POLICY "الطلاب يمكنهم قراءة بياناتهم وحساباتهم" ON public.students
    FOR SELECT USING (TRUE);

CREATE POLICY "الطلاب يمكنهم تحديث خيار الرحلة Visual Journey" ON public.students
    FOR UPDATE USING (TRUE)
    WITH CHECK (TRUE);

-- 5. سياسات المعاملات النقاط (Point Transactions)
CREATE POLICY "المعلم يدير سجل المعاملات" ON public.point_transactions
    FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "الطلاب يستعرضون سجل نقاطهم" ON public.point_transactions
    FOR SELECT USING (TRUE);

-- 6. سياسات الإشعارات (Notifications)
CREATE POLICY "الطلاب يستعرضون إشعاراتهم" ON public.student_notifications
    FOR SELECT USING (TRUE);

CREATE POLICY "تحديث حالة القراءة للإشعارات" ON public.student_notifications
    FOR UPDATE USING (TRUE);
