import { AusenciasManager } from "./ausencias-manager";

type BlockedDateRow = {
  id: number;
  start_at: string;
  end_at: string;
  reason: string | null;
};

type AusenciasTabProps = {
  blockedDates: BlockedDateRow[];
};

export function AusenciasTab({ blockedDates }: AusenciasTabProps) {
  return (
    <section className="mt-4">
      <AusenciasManager blockedDates={blockedDates} />
    </section>
  );
}
