import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import BookmarksClient from "./ui/BookmarksClient";

export default async function AppPage() {
  const supabase = await supabaseServer();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: bookmarks, error } = await supabase
    .from("bookmarks")
    .select("id, url, title, created_at, user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    // Keep it simple for interview
    throw new Error(error.message);
  }

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Your Bookmarks</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <form action="/logout" method="post">
          <button className="rounded-xl border px-3 py-2">Logout</button>
        </form>
      </header>

      <BookmarksClient initialBookmarks={bookmarks ?? []} userId={user.id} />
    </main>
  );
}