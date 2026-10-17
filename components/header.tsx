import { HeaderClient } from "@/components/header-client";
import { getCurrentIdentity } from "@/lib/server/sites";

export async function Header() {
  const identity = await getCurrentIdentity();
  return <HeaderClient user={identity ? { name: identity.fullName?.trim() || identity.email.split("@")[0], email: identity.email } : null} />;
}
