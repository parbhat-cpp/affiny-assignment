"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  name: string;
}

export default function AppPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinData, setCheckinData] = useState<{
    streakCount?: number;
    coinBalance?: number;
    coinEarned?: number;
  } | null>(null);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [router]);

  useEffect(() => {
    const storedCheckinData = localStorage.getItem("checkin");

    if (storedCheckinData) {
      setCheckinData(JSON.parse(storedCheckinData));
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("checkin");
      router.push("/");
      handleLogout();
    }
  }, [handleLogout, router]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          router.push("/");
          return;
        }

        const data = await response.json();
        setUser(data.user);
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-zinc-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-zinc-200">App</h1>
            <div className="flex items-center gap-4">
              <span className="text-zinc-400">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>
          <h2 className="text-xl font-semibold text-zinc-200 mb-4">Your Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {/** Stat card component inline for concise layout */}
            <StatCard
              icon="🔥"
              label="Streak"
              value={checkinData?.streakCount}
              sub="Days in a row"
            />

            <StatCard
              icon="🪙"
              label="Balance"
              value={checkinData?.coinBalance}
              sub="Total coins"
            />

            <StatCard
              icon="➕"
              label="Earned"
              value={checkinData?.coinEarned}
              sub="This session"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: number | string | null | undefined;
  sub?: string;
}) {
  const display =
    value === null || value === undefined ? "-" : Number(value).toLocaleString();

  return (
    <div className="bg-zinc-900 p-6 rounded-lg shadow-md flex items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-xl">
        <span aria-hidden>{icon}</span>
      </div>

      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-2xl font-bold text-zinc-100">{display}</span>
          <span className="text-sm text-zinc-400">{label}</span>
        </div>
        {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
      </div>
    </div>
  );
}
