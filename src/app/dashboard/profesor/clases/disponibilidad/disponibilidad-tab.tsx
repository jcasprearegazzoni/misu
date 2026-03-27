type AvailabilityRow = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
};

type DisponibilidadTabProps = {
  availability: AvailabilityRow[];
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
    <section className="mx-auto mt-4 w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-3">
      <h2 className="text-base font-semibold text-zinc-900">Vista semanal</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Grilla de referencia para ver tus bloques disponibles por dia y hora.
      </p>

      {availability.length === 0 ? (
        <p className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
          Aun no tienes disponibilidad cargada.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-8 gap-px rounded-md border border-zinc-200 bg-zinc-200">
              <div className="bg-zinc-100 px-2 py-2 text-xs font-semibold text-zinc-700">Hora</div>
              {dayNames.map((dayName) => (
                <div key={dayName} className="bg-zinc-100 px-2 py-2 text-xs font-semibold text-zinc-700">
                  {dayName}
                </div>
              ))}

              {rows.map((hour) => {
                const rowStart = hour * 60;
                return (
                  <div key={hour} className="contents">
                    <div className="bg-white px-2 py-2 text-xs font-medium text-zinc-700">
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
                          className={`px-1.5 py-1.5 text-xs ${
                            activeBlock ? "bg-emerald-100 text-emerald-900" : "bg-white text-zinc-500"
                          }`}
                        >
                          {isStartCell ? (
                            <span className="inline-block rounded-md bg-emerald-700 px-1.5 py-0.5 text-[10px] font-medium text-white">
                              {activeBlock.start_time.slice(0, 5)}-{activeBlock.end_time.slice(0, 5)}
                            </span>
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
