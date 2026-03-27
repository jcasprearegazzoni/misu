import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/types/role";

export async function getUserRole(userId: string): Promise<Role | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error || !data?.role) {
    return null;
  }

  if (data.role !== "profesor" && data.role !== "alumno") {
    return null;
  }

  return data.role;
}
