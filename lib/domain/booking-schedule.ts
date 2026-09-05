export const BOOKING_START_TIMES = Array.from(
  { length: 24 },
  (_, hour) => `${hour.toString().padStart(2, "0")}:00`,
);

export const BOOKING_DURATION_MINUTES = Array.from(
  { length: 24 },
  (_, index) => (index + 1) * 30,
);

export const MIN_BOOKING_DURATION_MINUTES = BOOKING_DURATION_MINUTES[0];
export const MAX_BOOKING_DURATION_MINUTES = BOOKING_DURATION_MINUTES.at(-1) ?? 720;

export function isSupportedBookingDuration(minutes: number) {
  return Number.isInteger(minutes)
    && minutes >= MIN_BOOKING_DURATION_MINUTES
    && minutes <= MAX_BOOKING_DURATION_MINUTES
    && minutes % 30 === 0;
}

export function formatBookingDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const parts: string[] = [];

  if (hours) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (remainingMinutes) parts.push(`${remainingMinutes} minutes`);

  return parts.join(" ");
}
