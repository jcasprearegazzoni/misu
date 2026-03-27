import { AppNavbar } from "@/components/app-navbar";

export default async function AlumnoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppNavbar />
      {children}
    </>
  );
}
