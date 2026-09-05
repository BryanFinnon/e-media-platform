export type TimeRange = { start: Date; end: Date };

export type SlotOptions = {
  window: TimeRange;
  durationMinutes: number;
  intervalMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  busy: TimeRange[];
  now: Date;
  minimumNoticeMinutes: number;
  maximumHorizonDays: number;
};

const overlaps = (left: TimeRange, right: TimeRange) => left.start < right.end && left.end > right.start;
const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);

export function generateSlots(options: SlotOptions): TimeRange[] {
  if (options.durationMinutes <= 0 || options.intervalMinutes <= 0) return [];
  const earliest = addMinutes(options.now, options.minimumNoticeMinutes);
  const latest = new Date(options.now.getTime() + options.maximumHorizonDays * 86_400_000);
  const slots: TimeRange[] = [];

  for (
    let start = new Date(options.window.start);
    addMinutes(start, options.durationMinutes) <= options.window.end;
    start = addMinutes(start, options.intervalMinutes)
  ) {
    const end = addMinutes(start, options.durationMinutes);
    if (start < earliest || start > latest) continue;
    const buffered = {
      start: addMinutes(start, -options.bufferBeforeMinutes),
      end: addMinutes(end, options.bufferAfterMinutes),
    };
    if (!options.busy.some((period) => overlaps(buffered, period))) slots.push({ start, end });
  }
  return slots;
}

export function rangesOverlap(left: TimeRange, right: TimeRange) {
  return overlaps(left, right);
}
