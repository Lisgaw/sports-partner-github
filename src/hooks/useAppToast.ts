"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { createI18nToast } from "@/lib/toast";

export function useAppToast(namespace?: string) {
  const t = useTranslations(namespace as never);

  return useMemo(
    () =>
      createI18nToast((key, values) =>
        t(key as never, values as never)
      ),
    [t]
  );
}
