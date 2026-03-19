// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUserIdMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  listingCountMock: vi.fn(),
  listingFindManyMock: vi.fn(),
  withCacheMock: vi.fn(),
  cacheGetMock: vi.fn(),
}));

vi.mock("@/lib/api-utils", () => ({
  getCurrentUserId: mocks.getCurrentUserIdMock,
  unauthorized: () =>
    new Response(JSON.stringify({ success: false, error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.userFindUniqueMock },
    listing: {
      count: mocks.listingCountMock,
      findMany: mocks.listingFindManyMock,
    },
  },
}));

vi.mock("@/lib/cache", () => ({
  withCache: mocks.withCacheMock,
  cacheGet: mocks.cacheGetMock,
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    error: vi.fn(),
  }),
}));

import { GET } from "@/app/api/feed/route";

describe("GET /api/feed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.withCacheMock.mockImplementation(async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn());
    mocks.cacheGetMock.mockResolvedValue(null);
    mocks.getCurrentUserIdMock.mockResolvedValue("u1");
    mocks.userFindUniqueMock.mockResolvedValue({
      cityId: "city1",
      sports: [{ id: "sport1" }],
      following: [{ followingId: "u2" }],
    });
    mocks.listingCountMock.mockResolvedValue(1);
    mocks.listingFindManyMock.mockResolvedValue([
      {
        id: "l1",
        type: "RIVAL",
        dateTime: new Date().toISOString(),
        level: "BEGINNER",
        status: "OPEN",
        description: "desc",
        maxParticipants: 2,
        sport: { id: "sport1", name: "Futbol", icon: "⚽" },
        district: null,
        city: null,
        venue: null,
        user: { id: "u2", name: "User 2", avatarUrl: null },
        _count: { responses: 0 },
      },
    ]);
  });

  it("returns 401 for unauthenticated requests", async () => {
    mocks.getCurrentUserIdMock.mockResolvedValueOnce(null);

    const req = new Request("http://localhost/api/feed?page=1");
    const res = await GET(req as any);

    expect(res.status).toBe(401);
  });

  it("returns private cacheable feed payload", async () => {
    const req = new Request("http://localhost/api/feed?page=1");
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].isFromFollowing).toBe(true);
    expect(res.headers.get("Cache-Control")).toContain("private");
  });
});
