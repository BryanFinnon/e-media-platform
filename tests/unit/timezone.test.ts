import { describe, expect, it } from "vitest";
import { zonedLocalToUtc } from "@/lib/domain/timezone";

describe("Europe/London wall-clock conversion", () => {
  it("uses British Summer Time in August", () => { expect(zonedLocalToUtc("2026-08-20", "10:00", "Europe/London").toISOString()).toBe("2026-08-20T09:00:00.000Z"); });
  it("uses Greenwich Mean Time in December", () => { expect(zonedLocalToUtc("2026-12-20", "10:00", "Europe/London").toISOString()).toBe("2026-12-20T10:00:00.000Z"); });
});
