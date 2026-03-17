import baseToast, { type ToastOptions } from "react-hot-toast";
import type { TranslationValues } from "next-intl";

export type ToastMessageInput =
  | string
  | {
      key: string;
      values?: TranslationValues;
    };

export type ToastTranslator = (key: string, values?: TranslationValues) => string;

function resolveToastMessage(
  translator: ToastTranslator,
  message: ToastMessageInput
): string {
  if (typeof message === "string") {
    return translator(message);
  }

  return translator(message.key, message.values);
}

export function createI18nToast(translator: ToastTranslator) {
  return {
    success(message: ToastMessageInput, options?: ToastOptions) {
      return baseToast.success(resolveToastMessage(translator, message), options);
    },
    error(message: ToastMessageInput, options?: ToastOptions) {
      return baseToast.error(resolveToastMessage(translator, message), options);
    },
    loading(message: ToastMessageInput, options?: ToastOptions) {
      return baseToast.loading(resolveToastMessage(translator, message), options);
    },
    dismiss: baseToast.dismiss,
    remove: baseToast.remove,
    promise: baseToast.promise,
    custom: baseToast.custom,
  };
}

export default baseToast;
