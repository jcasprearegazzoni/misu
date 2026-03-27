export type TimeOption = {
  value: string;
  label: string;
};

type BuildHalfHourTimeOptionsParams = {
  startHour?: number;
  endHour?: number;
};

export function buildHalfHourTimeOptions(params?: BuildHalfHourTimeOptionsParams) {
  const startHour = params?.startHour ?? 6;
  const endHour = params?.endHour ?? 23;
  const options: TimeOption[] = [];

  for (let hour = startHour; hour <= endHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      options.push({ value, label: value });
    }
  }

  return options;
}
