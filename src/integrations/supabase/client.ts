import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hard-coded to prevent Vercel dashboard env vars from overriding the correct project.
// These are public anon keys (safe to commit).
const SUPABASE_URL = 'https://kryiituxmejqfszinicu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeWlpdHV4bWVqcWZzemluaWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NDg1NTIsImV4cCI6MjA5NDQyNDU1Mn0.Pt9Xm5v1mQrAB-xHUnYlo48XSFEKOJOXpviiXThPcG0';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});