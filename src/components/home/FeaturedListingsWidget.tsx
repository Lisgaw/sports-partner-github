"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";

interface FeaturedListing {
  id: string;
  type: string;
  dateTime: string;
  city: { id: string; name: string } | null;
  district: { id: string; name: string } | null;
  sport: { id: string; name: string; icon: string | null } | null;
  user: { id: string; name: string; avatarUrl: string | null; isVerifiedUser: boolean };
  _count: { responses: number; interests: number };
  maxParticipants: number;
  description: string | null;
}

export default function FeaturedListingsWidget() {
  const [listings, setListings] = useState<FeaturedListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/listings/featured")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.success) setListings(data.data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <div className="mb-8 animate-pulse">
      <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    </div>
  );

  if (listings.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔥</span>
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Günün Öne Çıkanları</h2>
        <span className="text-xs text-gray-400 dark:text-gray-500">— En çok ilgi gören ilanlar</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/ilan/${listing.id}`}
            className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">{listing.sport?.icon || "🏅"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                  {listing.sport?.name} — {listing.city?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {format(new Date(listing.dateTime), "d MMM, HH:mm")}
                  {listing.district ? ` · ${listing.district.name}` : ""}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ⭐ <span className="font-semibold text-gray-700 dark:text-gray-300">{listing._count.interests}</span> ilgi
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    💬 {listing._count.responses} yanıt
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              {listing.user.avatarUrl ? (
                <img src={listing.user.avatarUrl} alt={listing.user.name} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-700 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  {listing.user.name.charAt(0)}
                </div>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {listing.user.name}
                {listing.user.isVerifiedUser && <span className="ml-1 text-emerald-500 font-bold">✓</span>}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
