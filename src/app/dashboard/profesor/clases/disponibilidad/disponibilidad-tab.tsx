type AvailabilityRow = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  club_id: number | null;
  club_nombre: string | null;
};

type DisponibilidadTabProps = {
  availability: AvailabilityRow[];
  clubs: Array<{ id: number; nombre: string }>;
};

const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

function timeToMinutes(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function formatHour(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  return `${String(hours).padStart(2, "0")}:00`;
}

function getGridBounds(availability: AvailabilityRow[]) {
  if (availability.length === 0) {
    return { startHour: 7, endHour: 22 };
  }

  const starts = availability.map((item) => timeToMinutes(item.start_time));
  const ends = availability.map((item) => timeToMinutes(item.end_time));
  const startHour = Math.max(0, Math.floor(Math.min(...starts) / 60));
  const endHour = Math.min(24, Math.ceil(Math.max(...ends) / 60));

  return {
    startHour,
    endHour: Math.max(startHour + 1, endHour),
  };
}

export function DisponibilidadTab({ availability }: DisponibilidadTabProps) {
  const byDay = Array.from({ length: 7 }, (_, day) =>
    availability
      .filter((item) => item.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
  );

  const { startHour, endHour } = getGridBounds(availability);
  const rows = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);

  return (
    <section className="mx-auto mt-4 w-full max-w-3xl rounded-xl p-4" style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}>
      <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Vista semanal</h2>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        Grilla de referencia para ver tus bloques disponibles por día y hora.
      </p>

      {availability.length === 0 ? (
        <p className="mt-3 rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}>
          Aún no tienes disponibilidad cargada.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-8 gap-px rounded-md" style={{ border: "1px solid var(--border)", background: "var(--border)" }}>
              <div className="px-2 py-2 text-xs font-semibold" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>Hora</div>
              {dayNames.map((dayName) => (
                <div key={dayName} className="px-2 py-2 text-xs font-semibold" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                  {dayName}
                </div>
              ))}

              {rows.map((hour) => {
                const rowStart = hour * 60;
                return (
                  <div key={hour} className="contents">
                    <div className="px-2 py-2 text-xs font-medium" style={{ background: "var(--surface-1)", color: "var(--muted)" }}>
                      {formatHour(rowStart)}
                    </div>

                    {byDay.map((dayItems, dayIndex) => {
                      const activeBlock = dayItems.find((item) => {
                        const start = timeToMinutes(item.start_time);
                        const end = timeToMinutes(item.end_time);
                        return rowStart >= start && rowStart < end;
                      });

                      const isStartCell =
                        activeBlock !== undefined && rowStart === timeToMinutes(activeBlock.start_time);

                      return (
                        <div
                          key={`${dayIndex}-${hour}`}
                          className="px-1.5 py-1.5 text-xs"
                          style={
                            activeBlock
                              ? { background: "rgba(34,197,94,0.14)", color: "#86efac" }
                              : { background: "var(--surface-1)", color: "var(--muted-2)" }
                          }
                        >
                          {isStartCell ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white" style={{ background: "#15803d" }}>
                                {activeBlock.start_time.slice(0, 5)}-{activeBlock.end_time.slice(0, 5)}
                              </span>
                              {activeBlock.club_nombre ? (
                                <span className="text-[9px] font-medium truncate max-w-full" style={{ color: "#86efac" }}>
                                  {activeBlock.club_nombre}
                                </span>
                              ) : (
                                <span className="text-[9px] font-medium" style={{ color: "#86efac" }}>
                                  Particulares
                                </span>
                              )}
                            </div>
                          ) : (
                            " "
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
