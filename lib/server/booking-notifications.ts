import "server-only";
import {
  bookingConfirmation,
  bookingRequestAcknowledgement,
  bookingTeamNotification,
  type BookingEmailCopy,
  type BookingEmailDetails,
} from "@/lib/domain/booking-emails";
import { env } from "@/lib/env";
import { sendTransactionalEmail, type EmailKind } from "@/lib/server/email";
import { createId, type D1Database } from "@/lib/server/sites";

type EmailColumn =
  | "client_request_email_sent_at"
  | "team_request_email_sent_at"
  | "client_confirmation_email_sent_at";

type Delivery = {
  to: string;
  kind: EmailKind;
  copy: BookingEmailCopy;
  column: EmailColumn;
  idempotencyKey: string;
  action?: { label: string; href: string };
};

type NotifyInput = {
  database: D1Database;
  bookingId: string;
  actorEmail: string;
  booking: BookingEmailDetails;
};

async function deliver({ database, bookingId, actorEmail }: NotifyInput, delivery: Delivery) {
  const result = await sendTransactionalEmail({
    to: delivery.to,
    kind: delivery.kind,
    ...delivery.copy,
    action: delivery.action,
    idempotencyKey: delivery.idempotencyKey,
  });
  const now = new Date().toISOString();
  const action = `booking.email_${result.status}`;
  const metadata = JSON.stringify({
    kind: delivery.kind,
    providerMessageId: result.status === "sent" ? result.id : null,
    reason: result.status === "sent" ? null : result.reason,
  });
  const statements = [
    database
      .prepare(
        `INSERT INTO audit_log (id, actor_email, action, entity_type, entity_id, metadata_json, created_at)
         VALUES (?, ?, ?, 'booking', ?, ?, ?)`,
      )
      .bind(createId("audit"), actorEmail, action, bookingId, metadata, now),
  ];

  if (result.status === "sent") {
    statements.unshift(
      database
        .prepare(`UPDATE bookings SET ${delivery.column} = ?, updated_at = ? WHERE id = ?`)
        .bind(now, now, bookingId),
    );
  }
  await database.batch(statements);
}

export async function notifyBookingCreated(input: NotifyInput) {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || "";
  const deliveries: Delivery[] = [
    {
      to: input.booking.clientEmail,
      kind: "BOOKING_REQUEST",
      copy: bookingRequestAcknowledgement(input.booking),
      column: "client_request_email_sent_at",
      idempotencyKey: `booking-request-client/${input.bookingId}`,
    },
  ];

  if (env.BOOKING_NOTIFICATION_EMAIL) {
    deliveries.push({
      to: env.BOOKING_NOTIFICATION_EMAIL,
      kind: "BOOKING_REQUEST",
      copy: bookingTeamNotification(input.booking),
      column: "team_request_email_sent_at",
      idempotencyKey: `booking-request-team/${input.bookingId}`,
      action: siteUrl ? { label: "Review booking", href: `${siteUrl}/admin/bookings` } : undefined,
    });
  }

  await Promise.allSettled(deliveries.map((delivery) => deliver(input, delivery)));
}

export async function notifyBookingConfirmed(input: NotifyInput) {
  await Promise.allSettled([
    deliver(input, {
      to: input.booking.clientEmail,
      kind: "BOOKING_CONFIRMED",
      copy: bookingConfirmation(input.booking),
      column: "client_confirmation_email_sent_at",
      idempotencyKey: `booking-confirmed-client/${input.bookingId}`,
    }),
  ]);
}
