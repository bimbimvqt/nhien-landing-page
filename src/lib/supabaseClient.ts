import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Ensure we have a valid URL format for the build process
const finalUrl = supabaseUrl.startsWith('http') 
  ? supabaseUrl 
  : 'https://placeholder-url.supabase.co';

const finalKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey);
