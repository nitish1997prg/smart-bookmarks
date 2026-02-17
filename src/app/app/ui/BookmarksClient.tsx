"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { addBookmark, deleteBookmark } from "../actions";

type Bookmark = {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
  created_at: string;
};

export default function BookmarksClient({
  initialBookmarks,
  userId,
}: {
  initialBookmarks: Bookmark[];
  userId: string;
}) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  // Realtime for cross-tab updates
  useEffect(() => {
    const channel = supabase
      .channel("bookmarks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const b = payload.new as Bookmark;
            setBookmarks((prev) => (prev.some((x) => x.id === b.id) ? prev : [b, ...prev]));
          }
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id: string };
            setBookmarks((prev) => prev.filter((b) => b.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        const inserted = await addBookmark(formData);

        // Update UI immediately (same tab)
        setBookmarks((prev) => [inserted as Bookmark, ...prev]);

        form.reset();

        // Optional: keep server state in sync
        router.refresh();
      } catch (err: any) {
        setError(err?.message ?? "Failed to add bookmark");
      }
    });
  };

  return (
    <section className="space-y-4">
      <form onSubmit={onSubmit} className="rounded-2xl border p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="url"
            placeholder="example.com"
            className="w-full rounded-xl border px-3 py-2"
            required
          />
          <input
            name="title"
            placeholder="Title (optional)"
            className="w-full rounded-xl border px-3 py-2"
          />
        </div>

        <button
          disabled={isPending}
          className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-60"
        >
          {isPending ? "Adding..." : "Add Bookmark"}
        </button>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>

      <div className="space-y-2">
        {bookmarks.length === 0 ? (
          <div className="text-sm text-gray-500">No bookmarks yet.</div>
        ) : (
          bookmarks.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border p-4 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <a
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline break-words"
                >
                  {b.title || b.url}
                </a>
                {b.title && (
                  <div className="text-xs text-gray-500 break-words">{b.url}</div>
                )}
              </div>

              <button
  onClick={() => {
    startTransition(async () => {
      try {
        setError("");

        // Optimistic update (instant UI)
        setBookmarks((prev) => prev.filter((x) => x.id !== b.id));

        await deleteBookmark(b.id);

        // Keep server snapshot in sync
        router.refresh();
      } catch (err: any) {
        setError(err?.message ?? "Failed to delete bookmark");
        // rollback if needed (optional)
        router.refresh();
      }
    });
  }}
  className="shrink-0 rounded-xl border px-3 py-2"
>
  Delete
</button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}