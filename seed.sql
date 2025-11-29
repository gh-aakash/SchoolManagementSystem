
-- -----------------------------------------------------------------------------
-- SEED DATA FOR SCHOOLOS
-- Run this in the Supabase SQL Editor to populate your database with initial data.
-- -----------------------------------------------------------------------------

-- Note: You need a valid 'school_id' to insert data. 
-- Since we have RLS, we can't easily insert for a specific school from SQL Editor 
-- unless we impersonate a user or disable RLS temporarily.
-- 
-- HOWEVER, for initial setup, you can use the following approach:
-- 1. Sign up a user in the App.
-- 2. Get their school_id from the `schools` table.
-- 3. Replace 'YOUR_SCHOOL_ID_HERE' below with that UUID.

DO $$
DECLARE
  target_school_id uuid := 'YOUR_SCHOOL_ID_HERE'; -- <--- REPLACE THIS AFTER SIGNING UP
  class_id uuid;
BEGIN

  -- Only proceed if the ID is replaced
  IF target_school_id = 'YOUR_SCHOOL_ID_HERE' THEN
    RAISE NOTICE 'Please replace YOUR_SCHOOL_ID_HERE with a valid school_id from the schools table.';
    RETURN;
  END IF;

  -- 1. Insert Classes (1 to 10)
  INSERT INTO classes (school_id, name, order_index) VALUES
  (target_school_id, 'Class 1', 1),
  (target_school_id, 'Class 2', 2),
  (target_school_id, 'Class 3', 3),
  (target_school_id, 'Class 4', 4),
  (target_school_id, 'Class 5', 5),
  (target_school_id, 'Class 6', 6),
  (target_school_id, 'Class 7', 7),
  (target_school_id, 'Class 8', 8),
  (target_school_id, 'Class 9', 9),
  (target_school_id, 'Class 10', 10);

  -- 2. Insert Sections for each Class (A, B)
  FOR class_id IN SELECT id FROM classes WHERE school_id = target_school_id LOOP
    INSERT INTO sections (school_id, class_id, name) VALUES
    (target_school_id, class_id, 'A'),
    (target_school_id, class_id, 'B');
  END LOOP;

  -- 3. Insert Fee Heads
  INSERT INTO fee_heads (school_id, name, description) VALUES
  (target_school_id, 'Tuition Fee', 'Monthly tuition fee'),
  (target_school_id, 'Admission Fee', 'One-time admission fee'),
  (target_school_id, 'Exam Fee', 'Term examination fee'),
  (target_school_id, 'Transport Fee', 'Monthly bus fee');

  -- 4. Insert Transport Routes
  INSERT INTO transport_routes (school_id, route_name, vehicle_number, driver_name, driver_phone) VALUES
  (target_school_id, 'Route 1 - North City', 'MH-04-AB-1234', 'Ramesh Kumar', '9876543210'),
  (target_school_id, 'Route 2 - South City', 'MH-04-CD-5678', 'Suresh Singh', '9876543211');

  RAISE NOTICE 'Seed data inserted successfully for school %', target_school_id;

END $$;
