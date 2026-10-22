import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export interface StudentAssessmentResult {
  id: string;
  unit_id: string;
  assessment_id: string;
  assessment_title: string;
  assessment_type: 'quiz' | 'practice';
  student_name: string;
  student_email: string;
  student_id: string | null;
  score: number;
  total: number;
  submitted_at: string;
}

export class StudentResultsError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'StudentResultsError';
  }
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    throw new StudentResultsError(
      'Student results are not configured. Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.',
      503
    );
  }

  return { url, anonKey, serviceRoleKey };
}

export async function authenticateRequest(req: Request): Promise<AuthenticatedUser> {
  const authorization = req.header('authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new StudentResultsError('Sign in to submit or view assessment results.', 401);

  const { url, anonKey } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new StudentResultsError('Your session has expired. Please sign in again.', 401);
    }
    throw new StudentResultsError('Could not verify the Supabase user session.', 502);
  }

  return (await response.json()) as AuthenticatedUser;
}

export function requireTeacher(user: AuthenticatedUser): void {
  const email = user.email?.toLowerCase();
  const role = user.user_metadata?.role;
  const allowedEmails = (process.env.SUPABASE_TEACHER_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (role !== 'teacher' || !email || !allowedEmails.includes(email)) {
    throw new StudentResultsError('This account is not authorized to view teacher assessment results.', 403);
  }
}

async function supabaseRestRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(`Supabase student results request failed (${response.status}):`, detail);
    throw new StudentResultsError('Could not save or load assessment results. Check the Supabase table setup.', 502);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function saveStudentAssessmentResult(result: Omit<StudentAssessmentResult, 'id' | 'submitted_at'>) {
  const rows = await supabaseRestRequest<StudentAssessmentResult[]>('student_assessment_results?select=*', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(result),
  });
  const saved = rows[0];
  if (!saved) throw new StudentResultsError('Supabase did not return the saved assessment result.', 502);
  return saved;
}

export async function getStudentAssessmentResults(unitId: string): Promise<StudentAssessmentResult[]> {
  const query = new URLSearchParams({
    select: 'id,unit_id,assessment_id,assessment_title,assessment_type,student_name,student_email,student_id,score,total,submitted_at',
    unit_id: `eq.${unitId}`,
    order: 'submitted_at.desc',
  });
  return supabaseRestRequest<StudentAssessmentResult[]>(`student_assessment_results?${query.toString()}`);
}
