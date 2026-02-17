"use client";

import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const onLogin = async () => {
    const supabase = supabaseBrowser();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm rounded-2xl border p-6 space-y-4">
        <h1 className="text-xl font-semibold">Smart Bookmarks</h1>
        <button
          onClick={onLogin}
          className="w-full rounded-xl bg-black text-white py-2"
        >
          Continue with Google
        </button>
      </div>
    </main>
  );
}