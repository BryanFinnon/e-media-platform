"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const credentials = z.object({ email: z.email(), password: z.string().min(8).max(128) });
const safeMessage = (value: string) => encodeURIComponent(value.slice(0, 120));

export async function signIn(formData: FormData) {
  const parsed = credentials.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/auth/login?error=${safeMessage("Enter a valid email and password.")}`);
  const client = await createServerClient();
  if (!client) redirect(`/auth/login?error=${safeMessage("Authentication is not configured in this environment.")}`);
  const { error } = await client.auth.signInWithPassword(parsed.data);
  if (error) redirect(`/auth/login?error=${safeMessage("Sign-in failed. Check your details and try again.")}`);
  redirect("/account");
}

export async function signUp(formData: FormData) {
  const parsed = credentials.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/auth/signup?error=${safeMessage("Use a valid email and a password of at least eight characters.")}`);
  const client = await createServerClient();
  if (!client) redirect(`/auth/signup?error=${safeMessage("Authentication is not configured in this environment.")}`);
  const { error } = await client.auth.signUp(parsed.data);
  if (error) redirect(`/auth/signup?error=${safeMessage("We could not create the account. Please try again.")}`);
  redirect(`/auth/login?message=${safeMessage("Check your email to verify the account, then sign in.")}`);
}

export async function requestPasswordReset(formData: FormData) {
  const email = z.email().safeParse(formData.get("email"));
  if (!email.success) redirect(`/auth/forgot-password?error=${safeMessage("Enter a valid email address.")}`);
  const client = await createServerClient();
  if (!client) redirect(`/auth/forgot-password?error=${safeMessage("Authentication is not configured in this environment.")}`);
  await client.auth.resetPasswordForEmail(email.data, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password` });
  redirect(`/auth/login?message=${safeMessage("If that account exists, a reset link has been sent.")}`);
}

export async function signOut() {
  const client = await createServerClient();
  if (client) await client.auth.signOut();
  redirect("/");
}
