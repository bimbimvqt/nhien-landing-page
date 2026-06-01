import type { User } from "@supabase/supabase-js";

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAdminUser(user: User | null | undefined) {
  const email = user?.email?.toLowerCase();
  const role = String(
    user?.app_metadata?.role ||
      user?.app_metadata?.user_role ||
      user?.user_metadata?.role ||
      "",
  ).toLowerCase();

  if (role === "admin") {
    return true;
  }

  if (!email) {
    return false;
  }

  return adminEmails.includes(email);
}

export function getAuthRedirectUrl(path = "/") {
  if (typeof window === "undefined") {
    return path;
  }

  return `${window.location.origin}${path}`;
}

export function getUserDisplayName(user: User | null | undefined) {
  const metadata = user?.user_metadata;

  return (
    metadata?.full_name ||
    metadata?.name ||
    metadata?.preferred_username ||
    user?.email?.split("@")[0] ||
    "Khách hàng"
  );
}

export function getUserAvatarUrl(user: User | null | undefined) {
  const metadata = user?.user_metadata;

  return metadata?.avatar_url || metadata?.picture || null;
}
