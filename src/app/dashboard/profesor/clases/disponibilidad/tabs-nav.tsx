import Link from "next/link";

export type DisponibilidadTabKey = "disponibilidad" | "frecuente" | "ausencias";

type TabsNavProps = {
  activeTab: DisponibilidadTabKey;
};

const tabs: Array<{ key: DisponibilidadTabKey; label: string; shortLabel: string }> = [
  { key: "disponibilidad", label: "Disponibilidad", shortLabel: "Disponible" },
  { key: "frecuente", label: "Horario frecuente", shortLabel: "Frecuente" },
  { key: "ausencias", label: "Ausencias", shortLabel: "Ausencias" },
];

export function TabsNav({ activeTab }: TabsNavProps) {
  return (
    <nav className="mx-auto mt-5 w-full max-w-xl">
      <ul className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <li key={tab.key}>
              <Link
                href={`/dashboard/profesor/clases/disponibilidad?tab=${tab.key}`}
                className={`flex h-9 items-center justify-center rounded-full border px-2 text-[11px] font-medium sm:text-sm ${
                  isActive
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
                }`}
              >
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
