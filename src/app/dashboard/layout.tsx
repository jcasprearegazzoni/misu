import { AppNavbar } from "@/components/app-navbar";
import { getCurrentClub } from "@/lib/auth/get-current-club";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentClub = await getCurrentClub();
  const mobilePaddingClass = currentClub
    ? ""
    : "pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0";

  return (
    <>
      {!currentClub ? <AppNavbar /> : null}
      <div className={mobilePaddingClass}>{children}</div>
    </>
  );
}
