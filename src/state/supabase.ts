import { createClient } from "@supabase/supabase-js"

import type { Database } from "@app/types/database.types"

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Null when the env vars are absent (tests, forks without a project) so the
// app renders without cloud features instead of crashing at import time.
export const supabase = url && key ? createClient<Database>(url, key) : null

export const cloudConfigured = supabase !== null
