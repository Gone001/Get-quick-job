-- ============================================
-- QUICK JOB DATABASE OPTIMIZATION
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add missing columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS resume_url text,
ADD COLUMN IF NOT EXISTS experience text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS pincode text;

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_availability ON users(availability);
CREATE INDEX IF NOT EXISTS idx_jobs_employer ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_worker ON applications(worker_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- 3. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Add updated_at column and trigger to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT NOW();
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 5. Enable Row Level Security (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for users to update their own data
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 7. Create skills table for better skill management
CREATE TABLE IF NOT EXISTS public.user_skills (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  skill text NOT NULL,
  created_at timestamp with time zone DEFAULT NOW(),
  UNIQUE(user_id, skill)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);

-- 8. Create view for complete user profiles
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.phone,
  u.role,
  u.profile_image_url,
  u.bio,
  u.skills,
  u.experience,
  u.resume_url,
  u.company,
  u.latitude,
  u.longitude,
  u.city,
  u.pincode,
  u.availability,
  u.rating,
  u.total_reviews,
  u.completed_jobs,
  u.trust_score,
  u.profile_completed_min,
  u.created_at,
  u.updated_at,
  COALESCE(
    (SELECT json_agg(json_build_object('skill', skill))
     FROM user_skills us WHERE us.user_id = u.id),
    '[]'
  ) as skills_list
FROM users u;

-- 9. Create function to get nearby jobs (optimized)
CREATE OR REPLACE FUNCTION get_nearby_jobs(
  user_lat float,
  user_lng float,
  radius_km float DEFAULT 10,
  limit_count int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category text,
  pay integer,
  address text,
  city text,
  distance_km float,
  created_at timestamp
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.title,
    j.description,
    j.category,
    j.pay,
    j.address,
    j.city,
    (6371 * acos(cos(radians(user_lat)) * cos(radians(j.latitude)) * 
     cos(radians(j.longitude) - radians(user_lng)) + sin(radians(user_lat)) * 
     sin(radians(j.latitude))))::float as distance_km,
    j.created_at
  FROM jobs j
  WHERE j.status = 'open'
    AND j.latitude IS NOT NULL
    AND j.longitude IS NOT NULL
  ORDER BY distance_km ASC
  LIMIT limit_count;
END;
$$;

-- 10. Create function to search workers by skills
CREATE OR REPLACE FUNCTION search_workers(
  skill_search text[],
  min_rating float DEFAULT 0,
  limit_count int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  profile_image_url text,
  skills text[],
  bio text,
  rating float,
  completed_jobs int,
  city text,
  distance_km float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.email,
    u.profile_image_url,
    u.skills,
    u.bio,
    u.rating,
    u.completed_jobs,
    u.city,
    0.0 as distance_km
  FROM users u
  WHERE u.role = 'worker'
    AND u.availability = true
    AND u.rating >= min_rating
    AND u.skills && skill_search
  ORDER BY u.rating DESC, u.completed_jobs DESC
  LIMIT limit_count;
END;
$$;

-- 11. Add sample skills for reference
INSERT INTO public.user_skills (user_id, skill) 
SELECT id, unnest FROM users, unnest(ARRAY['Cleaning', 'Delivery', 'Driving', 'Cooking', 'Teaching', 'Pet Care', 'Moving', 'Assembly'])
WHERE role = 'worker'
ON CONFLICT DO NOTHING;

-- 12. Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.jobs TO authenticated;
GRANT ALL ON public.applications TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.user_skills TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_jobs TO authenticated;
GRANT EXECUTE ON FUNCTION search_workers TO authenticated;

-- Output completion message
SELECT 'Database optimization complete! Added: bio, skills, resume_url, experience, city, pincode columns to users table.' as status;