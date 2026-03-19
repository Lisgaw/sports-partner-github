"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body className="bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4">
          <section className="w-full rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/40 dark:bg-gray-900">
            <h1 className="text-2xl font-bold text-red-700 dark:text-red-400">Uygulama Hatası</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Beklenmeyen bir hata oluştu. Geçici ağ kesintileri veya timeout durumlarında tekrar denemeyi deneyin.
            </p>
            {process.env.NODE_ENV === "development" && (
              <pre className="mt-4 overflow-auto rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {error.message}
              </pre>
            )}
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
                onClick={() => window.location.assign("/")}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Ana Sayfa
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
