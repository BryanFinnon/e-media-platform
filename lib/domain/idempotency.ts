export function isUniqueViolation(error: { code?: string } | null | undefined) {
  return error?.code === "23505";
}
