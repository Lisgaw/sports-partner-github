// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userFindUniqueMock: vi.fn(),
  userCreateMock: vi.fn(),
  userUpdateMock: vi.fn(),
  transactionMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  getClientIPMock: vi.fn(),
  hashMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUniqueMock,
      create: mocks.userCreateMock,
      update: mocks.userUpdateMock,
    },
    $transaction: mocks.transactionMock,
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimitMock,
  getClientIP: mocks.getClientIPMock,
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: mocks.hashMock,
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { POST } from "@/app/api/auth/register/route";

const validRegisterPayload = {
  name: "Test User",
  email: "test@example.com",
  password: "Test123!",
  cityId: "city-1",
  districtId: "district-1",
  gender: "MALE",
  birthDate: "1995-06-15",
};

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getClientIPMock.mockReturnValue("127.0.0.1");
    mocks.checkRateLimitMock.mockResolvedValue({ allowed: true });
    mocks.hashMock.mockResolvedValue("hashed-password");
    mocks.userFindUniqueMock.mockResolvedValue(null);
    mocks.userCreateMock.mockResolvedValue({
      id: "c123456789012345678901234",
      name: "Test User",
      email: "test@example.com",
    });
    mocks.transactionMock.mockResolvedValue([]);
  });

  it("returns 429 when register rate limit is exceeded", async () => {
    mocks.checkRateLimitMock.mockResolvedValueOnce({ allowed: false });

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.success).toBe(false);
  });

  it("returns 400 for invalid payload", async () => {
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "bad-email" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 400 if email is already registered", async () => {
    mocks.userFindUniqueMock.mockResolvedValueOnce({ id: "u1" });

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify(validRegisterPayload),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mocks.userCreateMock).not.toHaveBeenCalled();
  });

  it("creates user and returns 201 for valid payload", async () => {
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify(validRegisterPayload),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(mocks.hashMock).toHaveBeenCalledWith("Test123!", 12);
    expect(mocks.userCreateMock).toHaveBeenCalledOnce();
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.email).toBe("test@example.com");
  });
});
