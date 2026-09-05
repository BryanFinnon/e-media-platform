import { formatBookingDuration } from "@/lib/domain/booking-schedule";

export type BookingEmailDetails = {
  reference: string;
  serviceName: string;
  clientName: string;
  clientEmail: string;
  preferredAt: string;
  durationMinutes: number;
  timezone: "Europe/London";
  brief: string;
};

export type BookingEmailCopy = {
  subject: string;
  preview: string;
  heading: string;
  paragraphs: string[];
  details: Array<{ label: string; value: string }>;
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name.trim();
}

function formatPreferredStart(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));
}

function scheduleDetails(booking: BookingEmailDetails) {
  return [
    { label: "Reference", value: booking.reference },
    { label: "Service", value: booking.serviceName },
    { label: "Preferred start", value: formatPreferredStart(booking.preferredAt, booking.timezone) },
    { label: "Duration", value: formatBookingDuration(booking.durationMinutes) },
    { label: "Time zone", value: "Europe/London" },
  ];
}

export function bookingRequestAcknowledgement(booking: BookingEmailDetails): BookingEmailCopy {
  return {
    subject: `We received your E-MEDIA request — ${booking.reference}`,
    preview: `Your project request ${booking.reference} has been received.`,
    heading: "Request received.",
    paragraphs: [
      `Hello ${firstName(booking.clientName)},`,
      "Thank you for choosing E-MEDIA. We have recorded your preferred booking details below.",
      "This is a booking request, not a final confirmation. Our team will check availability and contact you with the next steps and a quote where applicable.",
    ],
    details: scheduleDetails(booking),
  };
}

export function bookingTeamNotification(booking: BookingEmailDetails): BookingEmailCopy {
  return {
    subject: `New E-MEDIA request — ${booking.reference}`,
    preview: `${booking.clientName} submitted a new ${booking.serviceName} request.`,
    heading: "New project request.",
    paragraphs: [
      `${booking.clientName} (${booking.clientEmail}) submitted a new request through the website.`,
      `Project brief: ${booking.brief}`,
    ],
    details: scheduleDetails(booking),
  };
}

export function bookingConfirmation(booking: BookingEmailDetails): BookingEmailCopy {
  return {
    subject: `Your E-MEDIA booking is confirmed — ${booking.reference}`,
    preview: `E-MEDIA has confirmed your booking ${booking.reference}.`,
    heading: "Booking confirmed.",
    paragraphs: [
      `Hello ${firstName(booking.clientName)},`,
      "Your preferred schedule has now been confirmed by the E-MEDIA team.",
      "We will contact you separately with the production details and any applicable quote or commercial documents.",
    ],
    details: scheduleDetails(booking),
  };
}
