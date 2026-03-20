"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Trainer modulu kaldirildi - eski /ayarlar/profesyonel sayfasi artik mevcut degil

export default function ProfesyonelPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/ayarlar/profil");
  }, [router]);

  return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
    </div>
  );
}