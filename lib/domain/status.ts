export const bookingTransitions = {
  DRAFT: ["PENDING", "REQUESTED", "CANCELLED"],
  PENDING: ["AWAITING_PAYMENT", "REQUESTED", "CONFIRMED", "CANCELLED", "DECLINED"],
  AWAITING_PAYMENT: ["CONFIRMED", "CANCELLED", "DECLINED"],
  REQUESTED: ["CONFIRMED", "DECLINED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED", "REFUNDED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
  DECLINED: [],
} as const;

export type BookingStatus = keyof typeof bookingTransitions;

export function canTransitionBooking(from: BookingStatus, to: BookingStatus) {
  return (bookingTransitions[from] as readonly BookingStatus[]).includes(to);
}

export function isPublished(input: { status: string; publishedAt: Date | null }, now = new Date()) {
  return input.status === "PUBLISHED" && input.publishedAt !== null && input.publishedAt <= now;
}
