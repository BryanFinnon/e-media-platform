import { describe, expect, it } from "vitest";
import { hasPermission } from "@/lib/domain/permissions";
import { canTransitionBooking, isPublished } from "@/lib/domain/status";
import { isUniqueViolation } from "@/lib/domain/idempotency";

describe("security and lifecycle rules", () => {
  it("does not give members administrative access", () => { expect(hasPermission(["MEMBER"], "admin:access")).toBe(false); expect(hasPermission(["MEMBER"], "community:participate")).toBe(true); });
  it("allows staff booking management but not content publishing", () => { expect(hasPermission(["STAFF"], "booking:manage")).toBe(true); expect(hasPermission(["STAFF"], "content:publish")).toBe(false); });
  it("rejects impossible booking transitions", () => { expect(canTransitionBooking("CONFIRMED", "IN_PROGRESS")).toBe(true); expect(canTransitionBooking("COMPLETED", "DRAFT")).toBe(false); });
  it("publishes only released content", () => { const now = new Date("2026-08-14T12:00:00Z"); expect(isPublished({ status: "PUBLISHED", publishedAt: new Date("2026-08-14T11:00:00Z") }, now)).toBe(true); expect(isPublished({ status: "PUBLISHED", publishedAt: new Date("2026-08-14T13:00:00Z") }, now)).toBe(false); });
  it("recognises PostgreSQL unique violations for webhook idempotency", () => { expect(isUniqueViolation({ code: "23505" })).toBe(true); expect(isUniqueViolation({ code: "23503" })).toBe(false); });
});
