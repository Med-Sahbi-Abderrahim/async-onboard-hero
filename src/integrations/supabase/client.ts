// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Get environment variables with proper fallbacks
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://xcvupdkdrrqjrgjzvhoy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdnVwZGtkcnJxanJnanp2aG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTA1ODEsImV4cCI6MjA3NjgyNjU4MX0.U-9eAhTlQZWyoADxh69poA6V_bg9swACUhN7U5_10ZI";

// Validate that we have the required configuration
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("Missing Supabase configuration. Please check your environment variables.");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
  global: {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
  },
});