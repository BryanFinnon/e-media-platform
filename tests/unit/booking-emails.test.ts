import { describe, expect, it } from "vitest";
import {
  bookingConfirmation,
  bookingRequestAcknowledgement,
  bookingTeamNotification,
  type BookingEmailDetails,
} from "@/lib/domain/booking-emails";

const booking: BookingEmailDetails = {
  reference: "EM-TEST123",
  serviceName: "Photography",
  clientName: "Alex Morgan",
  clientEmail: "alex@example.com",
  preferredAt: "2026-08-29T14:00:00.000Z",
  durationMinutes: 90,
  timezone: "Europe/London",
  brief: "A clearly labelled development example project brief.",
};

describe("booking emails", () => {
  it("makes the initial acknowledgement clear that the booking is not yet confirmed", () => {
    const email = bookingRequestAcknowledgement(booking);
    expect(email.subject).toContain(booking.reference);
    expect(email.paragraphs.join(" ")).toContain("not a final confirmation");
    expect(email.details).toContainEqual({ label: "Duration", value: "1 hour 30 minutes" });
  });

  it("includes client contact and brief in the internal notification", () => {
    const email = bookingTeamNotification(booking);
    expect(email.paragraphs.join(" ")).toContain(booking.clientEmail);
    expect(email.paragraphs.join(" ")).toContain(booking.brief);
  });

  it("uses confirmation wording only after staff confirmation", () => {
    const email = bookingConfirmation(booking);
    expect(email.heading).toBe("Booking confirmed.");
    expect(email.subject).toContain(booking.reference);
  });
});
