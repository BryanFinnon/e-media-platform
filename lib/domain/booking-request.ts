import { z } from "zod";
import {
  MAX_BOOKING_DURATION_MINUTES,
  MIN_BOOKING_DURATION_MINUTES,
  isSupportedBookingDuration,
} from "@/lib/domain/booking-schedule";

export const bookingRequestSchema = z.object({
  serviceSlug: z.string().min(2).max(80),
  date: z.iso.date(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.number().int()
    .min(MIN_BOOKING_DURATION_MINUTES)
    .max(MAX_BOOKING_DURATION_MINUTES)
    .refine(isSupportedBookingDuration),
  name: z.string().trim().min(2).max(120),
  email: z.email(),
  brief: z.string().trim().min(20).max(5000),
  timezone: z.literal("Europe/London"),
});

const validationMessages: Record<string, string> = {
  serviceSlug: "Please choose a valid service.",
  date: "Please choose a valid preferred date.",
  time: "Please choose a valid start time.",
  durationMinutes: "Please choose a valid booking duration.",
  name: "Please enter your name using at least 2 characters.",
  email: "Please enter a valid email address.",
  brief: "Please describe your project using at least 20 characters.",
  timezone: "Please reload the page and try again.",
};

export function bookingRequestValidationMessage(error: z.ZodError) {
  const field = error.issues[0]?.path[0];
  return typeof field === "string"
    ? validationMessages[field] ?? "Please check the booking details and try again."
    : "Please check the booking details and try again.";
}
