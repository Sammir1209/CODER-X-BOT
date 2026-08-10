import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ypqthyglthytkwcikczz.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwcXRoeWdsdGh5dGt3Y2lrY3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMTQwMzksImV4cCI6MjEwMTg5MDAzOX0.6V5xYGmzwJ_YJYAxFiYORewn5t3cggtS-dzSyFBlwuw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
