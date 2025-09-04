import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function checkSupabaseConnection(): Promise<void> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Supabase connection check failed:", error.message);
    } else {
      console.log(
        "Supabase connected. Session present:",
        Boolean(data.session)
      );
      console.log(supabase);
    }
  } catch (err) {
    console.error("Supabase init error:", err);
  }
}
