import { describe, expect, it } from "vitest";
import { generateSlots, rangesOverlap } from "@/lib/domain/availability";

describe("availability", () => {
  it("generates intervals and removes buffered collisions", () => {
    const slots = generateSlots({ window: { start: new Date("2026-09-01T08:00:00Z"), end: new Date("2026-09-01T12:00:00Z") }, durationMinutes: 60, intervalMinutes: 60, bufferBeforeMinutes: 15, bufferAfterMinutes: 15, busy: [{ start: new Date("2026-09-01T09:50:00Z"), end: new Date("2026-09-01T10:10:00Z") }], now: new Date("2026-08-14T08:00:00Z"), minimumNoticeMinutes: 60, maximumHorizonDays: 90 });
    expect(slots.map((slot) => slot.start.toISOString())).toEqual(["2026-09-01T08:00:00.000Z", "2026-09-01T11:00:00.000Z"]);
  });
  it("uses half-open ranges so adjacent bookings do not collide", () => { expect(rangesOverlap({ start: new Date("2026-09-01T09:00:00Z"), end: new Date("2026-09-01T10:00:00Z") }, { start: new Date("2026-09-01T10:00:00Z"), end: new Date("2026-09-01T11:00:00Z") })).toBe(false); });
});
