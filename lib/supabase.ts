'use client';

import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase env variables missing');
    return null;
  }

  supabaseClient = createBrowserClient(supabaseUrl, supabaseKey);
  return supabaseClient;
};

export const supabase = getSupabaseClient();
