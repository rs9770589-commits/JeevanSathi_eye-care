import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/integrations/supabase/types";

export type { AppRole };

/** Read the signed-in user's roles straight from the roles table (RLS: own rows). */
export async function getMyRoles(): Promise<AppRole[]> {
  const { data, error } = await supabase.from("user_roles").select("role");
  if (error) return [];
  return (data ?? []).map((r) => r.role as AppRole);
}

export async function hasAnyRole(roles: AppRole[]): Promise<boolean> {
  const mine = await getMyRoles();
  return mine.some((r) => roles.includes(r));
}

/** Preferred home portal for a set of roles, in priority order. */
export function homeForRole(roles: AppRole[]): string {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("doctor")) return "/doctor";
  if (roles.includes("health_worker")) return "/worker";
  if (roles.includes("patient")) return "/patient";
  return "/";
}

export async function getMyProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone, language")
    .eq("id", user.id)
    .maybeSingle();
  return {
    id: user.id,
    email: user.email ?? "",
    full_name: data?.full_name ?? "",
    phone: data?.phone ?? "",
    language: data?.language ?? "en",
  };
}
