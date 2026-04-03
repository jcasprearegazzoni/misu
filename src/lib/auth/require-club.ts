import { redirect } from "next/navigation";
import { getCurrentClub } from "./get-current-club";

export async function requireClub() {
  const club = await getCurrentClub();

  if (!club) {
    redirect("/login");
  }

  return club;
}
