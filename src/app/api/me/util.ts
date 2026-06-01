import { supabase } from '@/lib/supabaseClient';

const DEFAULT_PUBLIC_API_BASE_URL = 'http://localhost:8080';

export function getServerApiBaseUrl() {
  if (process.env.NODE_ENV !== 'production') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_PUBLIC_API_BASE_URL;
  }
  return process.env.API_INTERNAL_URL || 'http://api:8080';
}

export function getAdminApiHeaders() {
  return {
    'X-Admin-API-Key': process.env.ADMIN_API_KEY || 'change_me',
    'Content-Type': 'application/json',
  };
}

export async function verifyUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }
  return user;
}
