import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROLE_VALUES, type Role } from "@/types/role";

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

  if (!ROLE_VALUES.includes(data.role as Role)) {
    return null;
  }

  return data.role;
}
