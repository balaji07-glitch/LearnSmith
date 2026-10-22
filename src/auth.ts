import type { User } from '@supabase/supabase-js';

export type UserRole = 'teacher' | 'student';

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  school?: string;
  subject?: string;
  employeeId?: string;
  studentId?: string;
  grade?: string;
  section?: string;
}

export function toAuthUser(user: User): AuthUser {
  const metadata = user.user_metadata || {};
  const role: UserRole = metadata.role === 'teacher' ? 'teacher' : 'student';

  return {
    id: user.id,
    role,
    name: typeof metadata.full_name === 'string'
      ? metadata.full_name
      : user.email?.split('@')[0] || 'Student',
    email: user.email || '',
    school: typeof metadata.school === 'string' ? metadata.school : undefined,
    subject: typeof metadata.subject === 'string' ? metadata.subject : undefined,
    employeeId: typeof metadata.employee_id === 'string' ? metadata.employee_id : undefined,
    studentId: typeof metadata.student_id === 'string' ? metadata.student_id : undefined,
    grade: typeof metadata.grade === 'string' ? metadata.grade : undefined,
    section: typeof metadata.section === 'string' ? metadata.section : undefined,
  };
}
