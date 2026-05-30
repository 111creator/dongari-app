-- =============================================
-- 충북대 동아리 앱 - Supabase SQL Schema
-- =============================================
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  student_id TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, department, student_id, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'student_id', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- CLUBS TABLE
-- =============================================
CREATE TABLE clubs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  president_id UUID REFERENCES profiles(id) NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 0,
  max_members INTEGER,
  is_recruiting BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- MEMBERSHIPS TABLE
-- =============================================
CREATE TABLE memberships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('president', 'executive', 'member', 'alumni', 'exchange_student')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- Update member_count trigger
CREATE OR REPLACE FUNCTION update_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
      UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
    ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
      UPDATE clubs SET member_count = member_count - 1 WHERE id = NEW.club_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
    UPDATE clubs SET member_count = member_count - 1 WHERE id = OLD.club_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER membership_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_member_count();

-- =============================================
-- JOIN APPLICATIONS TABLE
-- =============================================
CREATE TABLE join_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_president_applicant BOOLEAN NOT NULL DEFAULT false,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- POSTS TABLE
-- =============================================
CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('announcement', 'survey', 'general')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- FEE RECORDS TABLE
-- =============================================
CREATE TABLE fee_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- SUBGROUPS TABLE
-- =============================================
CREATE TABLE subgroups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- SUBGROUP MEMBERS TABLE
-- =============================================
CREATE TABLE subgroup_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subgroup_id UUID REFERENCES subgroups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(subgroup_id, user_id)
);

-- =============================================
-- ACTIVITY LOGS TABLE (아카이브/개신로그)
-- =============================================
CREATE TABLE activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  image_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE subgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE subgroup_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only self can update
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Clubs: public readable, only admins/presidents manage
CREATE POLICY "Clubs are publicly readable" ON clubs
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create clubs" ON clubs
  FOR INSERT WITH CHECK (auth.uid() = president_id);

CREATE POLICY "Presidents can update their clubs" ON clubs
  FOR UPDATE USING (auth.uid() = president_id);

-- Memberships: visible to club members
CREATE POLICY "Members can view club memberships" ON memberships
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM memberships m WHERE m.club_id = memberships.club_id AND m.user_id = auth.uid() AND m.status = 'approved')
  );

CREATE POLICY "Users can apply to clubs" ON memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Presidents can update membership status" ON memberships
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM clubs c WHERE c.id = memberships.club_id AND c.president_id = auth.uid())
  );

-- Posts: visible to club members
CREATE POLICY "Club members can view posts" ON posts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.club_id = posts.club_id AND m.user_id = auth.uid() AND m.status = 'approved')
  );

CREATE POLICY "Members can create posts" ON posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM memberships m WHERE m.club_id = posts.club_id AND m.user_id = auth.uid() AND m.status = 'approved')
  );

-- Fee records: visible to club members
CREATE POLICY "Club members can view fees" ON fee_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.club_id = fee_records.club_id AND m.user_id = auth.uid() AND m.status = 'approved')
  );

CREATE POLICY "Executives can manage fees" ON fee_records
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships m WHERE m.club_id = fee_records.club_id AND m.user_id = auth.uid() AND m.status = 'approved' AND m.role IN ('president', 'executive'))
  );

-- =============================================
-- SAMPLE DATA (Optional)
-- =============================================
-- INSERT INTO clubs (name, description, category, president_id, is_recruiting) VALUES
-- ('컴퓨터 프로그래밍 동아리', '프로그래밍을 함께 배우고 성장하는 동아리입니다.', '학술', '<president_uuid>', true),
-- ('농구 동아리', '매주 농구를 즐기는 동아리입니다.', '체육', '<president_uuid>', true);
