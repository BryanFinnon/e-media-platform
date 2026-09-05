import { describe, expect, it } from "vitest";
import { resolveFeature } from "@/lib/domain/features";
import { defaultFeatures } from "@/lib/content";

describe("feature flags", () => {
  it("prefers a database record and otherwise uses the safe fallback", () => { expect(resolveFeature("LIVE_ENABLED", [{ key: "LIVE_ENABLED", enabled: false }], defaultFeatures)).toBe(false); expect(resolveFeature("BOOKING_ENABLED", null, defaultFeatures)).toBe(true); });
});
