"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Route error boundary", error);
  }, [error]);

  return (
    <div className="mx-auto my-8 w-full max-w-xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/40 dark:bg-gray-900">
      <h2 className="text-xl font-bold text-red-700 dark:text-red-400">Bir şeyler ters gitti</h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Geçici bir sorun oluştu. Son veriler korunuyorsa arayüz onları göstermeye devam eder.
      </p>
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Tekrar Dene
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Sayfayı Yenile
        </button>
      </div>
    </div>
  );
}
