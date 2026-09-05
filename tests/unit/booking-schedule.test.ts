import { describe, expect, it } from "vitest";
import {
  BOOKING_DURATION_MINUTES,
  BOOKING_START_TIMES,
  formatBookingDuration,
  isSupportedBookingDuration,
} from "@/lib/domain/booking-schedule";

describe("booking schedule options", () => {
  it("offers every whole-hour start time", () => {
    expect(BOOKING_START_TIMES).toHaveLength(24);
    expect(BOOKING_START_TIMES[0]).toBe("00:00");
    expect(BOOKING_START_TIMES.at(-1)).toBe("23:00");
  });

  it("offers half-hour durations from 30 minutes to 12 hours", () => {
    expect(BOOKING_DURATION_MINUTES[0]).toBe(30);
    expect(BOOKING_DURATION_MINUTES.at(-1)).toBe(720);
    expect(BOOKING_DURATION_MINUTES.every(isSupportedBookingDuration)).toBe(true);
    expect(isSupportedBookingDuration(45)).toBe(false);
  });

  it("formats durations for the booking and admin screens", () => {
    expect(formatBookingDuration(30)).toBe("30 minutes");
    expect(formatBookingDuration(60)).toBe("1 hour");
    expect(formatBookingDuration(90)).toBe("1 hour 30 minutes");
    expect(formatBookingDuration(180)).toBe("3 hours");
  });
});
