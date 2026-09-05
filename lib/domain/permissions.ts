import type { UserRole } from "@/lib/types";

export type Permission =
  | "admin:access"
  | "content:publish"
  | "community:moderate"
  | "booking:manage"
  | "message:staff"
  | "profile:own"
  | "community:participate";

const grants: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: ["admin:access", "content:publish", "community:moderate", "booking:manage", "message:staff", "profile:own", "community:participate"],
  ADMIN: ["admin:access", "content:publish", "community:moderate", "booking:manage", "message:staff", "profile:own", "community:participate"],
  EDITOR: ["admin:access", "content:publish", "profile:own", "community:participate"],
  CREATOR: ["admin:access", "profile:own", "community:participate"],
  MODERATOR: ["admin:access", "community:moderate", "profile:own", "community:participate"],
  STAFF: ["admin:access", "booking:manage", "message:staff", "profile:own", "community:participate"],
  CLIENT: ["profile:own", "community:participate"],
  MEMBER: ["profile:own", "community:participate"],
};

export function hasPermission(roles: UserRole[], permission: Permission) {
  return roles.some((role) => grants[role].includes(permission));
}
