"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

function normalizeUrl(raw: string) {
  const t = raw.trim();
  if (!t) return "";
  if (!/^https?:\/\//i.test(t)) return `https://${t}`;
  return t;
}

export async function addBookmark(formData: FormData) {
  const supabase = await supabaseServer();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Not authenticated");

  const url = normalizeUrl(String(formData.get("url") ?? ""));
  const title = String(formData.get("title") ?? "").trim() || null;
  if (!url) throw new Error("URL required");

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({ user_id: user.id, url, title })
    .select("id, user_id, url, title, created_at")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/app");
  return data;
}

export async function deleteBookmark(id: string) {
  const supabase = await supabaseServer();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // extra safety even though RLS blocks anyway

  if (error) throw new Error(error.message);

  revalidatePath("/app");
}