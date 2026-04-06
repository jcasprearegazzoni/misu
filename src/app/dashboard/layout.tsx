import { AppNavbar } from "@/components/app-navbar";
import { getCurrentClub } from "@/lib/auth/get-current-club";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentClub = await getCurrentClub();

  return (
    <>
      {!currentClub ? <AppNavbar /> : null}
      {children}
    </>
  );
}
