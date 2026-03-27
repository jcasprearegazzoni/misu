import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/types/role";

export type CurrentProfile = {
  id: number;
  user_id: string;
  role: Role;
  name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  category: string | null;
  branch: string | null;
  zone: string | null;
  has_equipment: boolean;
  sport: "tenis" | "padel" | "ambos" | null;
  price_individual: number | null;
  price_dobles: number | null;
  price_trio: number | null;
  price_grupal: number | null;
  court_cost_mode: "fixed_per_hour" | "per_student_percentage";
  court_cost_per_hour: number | null;
  court_percentage_per_student: number | null;
  cancel_without_charge_hours: number | null;
  solo_warning_hours: number | null;
  solo_decision_deadline_minutes: number | null;
};

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, user_id, role, name, username, avatar_url, bio, category, branch, zone, has_equipment, sport, price_individual, price_dobles, price_trio, price_grupal, court_cost_mode, court_cost_per_hour, court_percentage_per_student, cancel_without_charge_hours, solo_warning_hours, solo_decision_deadline_minutes",
    )
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return null;
  }

  if (data.role !== "profesor" && data.role !== "alumno") {
    return null;
  }

  return data as CurrentProfile;
}
