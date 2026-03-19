// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUserIdMock: vi.fn(),
  getFeedPayloadMock: vi.fn(),
  getStaleFeedPayloadMock: vi.fn(),
}));

vi.mock("@/lib/api-utils", () => ({
  getCurrentUserId: mocks.getCurrentUserIdMock,
  unauthorized: () =>
    new Response(JSON.stringify({ success: false, error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
}));

vi.mock("@/lib/feed-snapshot", () => ({
  getFeedPayload: mocks.getFeedPayloadMock,
  getStaleFeedPayload: mocks.getStaleFeedPayloadMock,
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
    mocks.getCurrentUserIdMock.mockResolvedValue("u1");
    mocks.getFeedPayloadMock.mockResolvedValue({
      payload: {
        success: true,
        data: [
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
            isFromFollowing: true,
            isGroup: false,
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          pageSize: 12,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
      source: "snapshot-cache",
    });
    mocks.getStaleFeedPayloadMock.mockResolvedValue(null);
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
    expect(res.headers.get("X-Data-Source")).toBe("snapshot-cache");
  });

  it("returns stale snapshot payload when snapshot rebuild fails", async () => {
    mocks.getFeedPayloadMock.mockRejectedValueOnce(new Error("boom"));
    mocks.getStaleFeedPayloadMock.mockResolvedValueOnce({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    });

    const req = new Request("http://localhost/api/feed?page=1");
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.stale).toBe(true);
    expect(res.headers.get("X-Data-Source")).toBe("stale-snapshot");
  });
});
