import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  successMock: vi.fn(),
  errorMock: vi.fn(),
  loadingMock: vi.fn(),
  dismissMock: vi.fn(),
  removeMock: vi.fn(),
  promiseMock: vi.fn(),
  customMock: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: mocks.successMock,
    error: mocks.errorMock,
    loading: mocks.loadingMock,
    dismiss: mocks.dismissMock,
    remove: mocks.removeMock,
    promise: mocks.promiseMock,
    custom: mocks.customMock,
  },
}));

import { createI18nToast } from "@/lib/toast";

describe("createI18nToast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("translates string messages before success toast", () => {
    const t = vi.fn((key: string) => `translated:${key}`);
    const toast = createI18nToast(t);

    toast.success("errors.generic");

    expect(t).toHaveBeenCalledWith("errors.generic");
    expect(mocks.successMock).toHaveBeenCalledWith("translated:errors.generic", undefined);
  });

  it("translates key/value messages before error toast", () => {
    const t = vi.fn((key: string, values?: Record<string, unknown>) => `${key}:${values?.count}`);
    const toast = createI18nToast(t);

    toast.error({ key: "errors.limit", values: { count: 3 } });

    expect(t).toHaveBeenCalledWith("errors.limit", { count: 3 });
    expect(mocks.errorMock).toHaveBeenCalledWith("errors.limit:3", undefined);
  });

  it("exposes passthrough helpers", () => {
    const t = vi.fn((key: string) => key);
    const toast = createI18nToast(t);

    expect(toast.dismiss).toBe(mocks.dismissMock);
    expect(toast.remove).toBe(mocks.removeMock);
    expect(toast.promise).toBe(mocks.promiseMock);
    expect(toast.custom).toBe(mocks.customMock);
  });
});
