import { supabase } from './supabaseClient';

export async function fetchAdminApi(path: string, init?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = new Headers(init?.headers);
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  
  const response = await fetch(path, {
    ...init,
    headers,
  });
  
  return response;
}
