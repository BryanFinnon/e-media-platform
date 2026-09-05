import type { FeatureKey } from "@/lib/types";

export type FeatureRecord = { key: FeatureKey; enabled: boolean };

export function resolveFeature(key: FeatureKey, records: FeatureRecord[] | null, fallback: Record<FeatureKey, boolean>) {
  return records?.find((record) => record.key === key)?.enabled ?? fallback[key];
}
