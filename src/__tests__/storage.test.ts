import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  fromMock: vi.fn(),
  uploadMock: vi.fn(),
  removeMock: vi.fn(),
  getPublicUrlMock: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClientMock,
}));

import {
  STORAGE_BUCKETS,
  getPublicUrl,
  getSupabaseAdminClient,
  getSupabasePublicClient,
  uploadFile,
} from "@/lib/storage";

describe("storage helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";

    mocks.fromMock.mockReturnValue({
      upload: mocks.uploadMock,
      remove: mocks.removeMock,
      getPublicUrl: mocks.getPublicUrlMock,
    });

    mocks.createClientMock.mockReturnValue({
      storage: {
        from: mocks.fromMock,
      },
    });
  });

  it("throws for missing public supabase env", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(() => getSupabasePublicClient()).toThrow("Supabase env değişkenleri eksik");
  });

  it("creates admin client with service role", () => {
    const client = getSupabaseAdminClient();
    expect(client).toBeTruthy();
    expect(mocks.createClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role"
    );
  });

  it("uploadFile returns public url on success", async () => {
    mocks.uploadMock.mockResolvedValue({ error: null });
    mocks.getPublicUrlMock.mockReturnValue({ data: { publicUrl: "https://cdn.example/file.jpg" } });

    const result = await uploadFile(
      STORAGE_BUCKETS.AVATARS,
      "u1/avatar.jpg",
      Buffer.from("data"),
      "image/jpeg"
    );

    expect(result.url).toBe("https://cdn.example/file.jpg");
    expect(result.error).toBeUndefined();
  });

  it("uploadFile returns error when supabase upload fails", async () => {
    mocks.uploadMock.mockResolvedValue({ error: { message: "upload failed" } });

    const result = await uploadFile(
      STORAGE_BUCKETS.POSTS,
      "post1/0.jpg",
      Buffer.from("data"),
      "image/jpeg"
    );

    expect(result.url).toBe("");
    expect(result.error).toContain("upload failed");
  });

  it("builds public URL from env", () => {
    expect(getPublicUrl(STORAGE_BUCKETS.POSTS, "p1/1.jpg")).toBe(
      "https://example.supabase.co/storage/v1/object/public/posts/p1/1.jpg"
    );
  });
});
