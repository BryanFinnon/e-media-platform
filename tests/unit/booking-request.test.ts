import { describe, expect, it } from "vitest";
import {
  bookingRequestSchema,
  bookingRequestValidationMessage,
} from "@/lib/domain/booking-request";

const validRequest = {
  serviceSlug: "photography",
  date: "2026-08-30",
  time: "14:00",
  durationMinutes: 120,
  name: "Alex Morgan",
  email: "alex@example.com",
  brief: "A launch campaign with portraits and behind-the-scenes coverage.",
  timezone: "Europe/London" as const,
};

describe("booking request validation", () => {
  it("accepts a complete booking request", () => {
    expect(bookingRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("explains the minimum project description length", () => {
    const result = bookingRequestSchema.safeParse({ ...validRequest, brief: "Quick shoot" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(bookingRequestValidationMessage(result.error)).toBe(
      "Please describe your project using at least 20 characters.",
    );
  });

  it("rejects malformed email addresses", () => {
    const result = bookingRequestSchema.safeParse({ ...validRequest, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(bookingRequestValidationMessage(result.error)).toBe(
      "Please enter a valid email address.",
    );
  });
});
