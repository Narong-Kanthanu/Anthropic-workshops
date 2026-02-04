/**
 * @vitest-environment node
 */
import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { SignJWT, jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

import {
  createSession,
  getSession,
  deleteSession,
  verifySession,
  SessionPayload,
} from "@/lib/auth";

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

test("createSession creates JWT token and sets cookie", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
  const [cookieName, token, options] = mockCookieStore.set.mock.calls[0];

  expect(cookieName).toBe("auth-token");
  expect(typeof token).toBe("string");
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");

  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("test@example.com");
});

test("createSession sets cookie expiry to 7 days", async () => {
  await createSession("user-123", "test@example.com");

  const options = mockCookieStore.set.mock.calls[0][2];
  const expectedExpiry = new Date("2024-01-22T12:00:00Z");

  expect(options.expires.getTime()).toBe(expectedExpiry.getTime());
});

test("createSession sets secure flag based on NODE_ENV", async () => {
  const originalEnv = process.env.NODE_ENV;

  process.env.NODE_ENV = "production";
  await createSession("user-123", "test@example.com");
  expect(mockCookieStore.set.mock.calls[0][2].secure).toBe(true);

  vi.clearAllMocks();

  process.env.NODE_ENV = "development";
  await createSession("user-456", "dev@example.com");
  expect(mockCookieStore.set.mock.calls[0][2].secure).toBe(false);

  process.env.NODE_ENV = originalEnv;
});

test("getSession returns null when no token exists", async () => {
  mockCookieStore.get.mockReturnValue(undefined);

  const session = await getSession();

  expect(session).toBeNull();
  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
});

test("getSession returns session payload for valid token", async () => {
  const expiresAt = new Date("2024-01-22T12:00:00Z");
  const session: SessionPayload = {
    userId: "user-123",
    email: "test@example.com",
    expiresAt,
  };

  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);

  mockCookieStore.get.mockReturnValue({ value: token });

  const result = await getSession();

  expect(result).not.toBeNull();
  expect(result?.userId).toBe("user-123");
  expect(result?.email).toBe("test@example.com");
});

test("getSession returns null for invalid token", async () => {
  mockCookieStore.get.mockReturnValue({ value: "invalid-token" });

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns null for expired token", async () => {
  const session: SessionPayload = {
    userId: "user-123",
    email: "test@example.com",
    expiresAt: new Date("2024-01-10T12:00:00Z"),
  };

  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(new Date("2024-01-10T12:00:00Z"))
    .setIssuedAt(new Date("2024-01-03T12:00:00Z"))
    .sign(JWT_SECRET);

  mockCookieStore.get.mockReturnValue({ value: token });

  const result = await getSession();

  expect(result).toBeNull();
});

test("deleteSession removes the auth cookie", async () => {
  await deleteSession();

  expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
});

test("verifySession returns null when no token in request", async () => {
  const mockRequest = {
    cookies: {
      get: vi.fn().mockReturnValue(undefined),
    },
  } as unknown as import("next/server").NextRequest;

  const session = await verifySession(mockRequest);

  expect(session).toBeNull();
  expect(mockRequest.cookies.get).toHaveBeenCalledWith("auth-token");
});

test("verifySession returns session payload for valid token in request", async () => {
  const expiresAt = new Date("2024-01-22T12:00:00Z");
  const session: SessionPayload = {
    userId: "user-456",
    email: "request@example.com",
    expiresAt,
  };

  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);

  const mockRequest = {
    cookies: {
      get: vi.fn().mockReturnValue({ value: token }),
    },
  } as unknown as import("next/server").NextRequest;

  const result = await verifySession(mockRequest);

  expect(result).not.toBeNull();
  expect(result?.userId).toBe("user-456");
  expect(result?.email).toBe("request@example.com");
});

test("verifySession returns null for invalid token in request", async () => {
  const mockRequest = {
    cookies: {
      get: vi.fn().mockReturnValue({ value: "bad-token" }),
    },
  } as unknown as import("next/server").NextRequest;

  const session = await verifySession(mockRequest);

  expect(session).toBeNull();
});

test("verifySession returns null for token signed with wrong secret", async () => {
  const wrongSecret = new TextEncoder().encode("wrong-secret-key");
  const session: SessionPayload = {
    userId: "user-789",
    email: "wrong@example.com",
    expiresAt: new Date("2024-01-22T12:00:00Z"),
  };

  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(wrongSecret);

  const mockRequest = {
    cookies: {
      get: vi.fn().mockReturnValue({ value: token }),
    },
  } as unknown as import("next/server").NextRequest;

  const result = await verifySession(mockRequest);

  expect(result).toBeNull();
});
