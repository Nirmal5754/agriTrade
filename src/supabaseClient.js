import { createClient } from "@supabase/supabase-js";

// Put these in your project root `.env` (Vite):
// VITE_SUPABASE_URL=...
// VITE_SUPABASE_ANON_KEY=...
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// We keep this file tiny for beginner-friendly usage.
export const supabase = createClient(url, anonKey);

