"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface ListingInterestButtonProps {
  listingId: string;
  ownerId: string;
  initialInterested?: boolean;
  initialCount?: number;
  className?: string;
}

export default function ListingInterestButton({
  listingId,
  ownerId,
  initialInterested = false,
  initialCount = 0,
  className = "",
}: ListingInterestButtonProps) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const isOwner = currentUserId === ownerId;

  const [interested, setInterested] = useState(initialInterested);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  // Fetch current state on mount
  useEffect(() => {
    if (!session || isOwner) return;
    let cancelled = false;
    fetch(`/api/listings/${listingId}/interest`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setInterested(data.interested);
          setCount(data.count);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [listingId, session, isOwner]);

  if (isOwner || !session) return null;

  const handleToggle = async () => {
    if (loading) return;
    // Optimistic update
    const newInterested = !interested;
    const newCount = newInterested ? count + 1 : count - 1;
    setInterested(newInterested);
    setCount(newCount);
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/interest`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Rollback
        setInterested(interested);
        setCount(count);
      } else {
        setCount(data.count);
      }
    } catch {
      setInterested(interested);
      setCount(count);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-pressed={interested}
      aria-label={interested ? "İlgiyi kaldır" : "İlginizi gösterin"}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
        interested
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      } ${loading ? "opacity-60 cursor-wait" : ""} ${className}`}
    >
      <span>{interested ? "⭐" : "☆"}</span>
      <span>{interested ? "İlgiliyim" : "İlgi Göster"}</span>
      {count > 0 && <span className="text-xs opacity-70">({count})</span>}
    </button>
  );
}
