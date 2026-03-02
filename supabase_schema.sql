-- STUDENTS TABLE
create table students (
  id uuid default gen_random_uuid() primary key,
  name text,
  roll_no text,
  division text,
  face_descriptor text
);

-- SESSIONS TABLE
create table sessions (
  id uuid default gen_random_uuid() primary key,
  teacher_name text,
  date text,
  division text,
  status text default 'active'
);

-- ATTENDANCE TABLE
create table attendance_records (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  timestamp timestamp default now()
);