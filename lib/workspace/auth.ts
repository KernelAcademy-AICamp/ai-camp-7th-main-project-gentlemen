import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { mutateDB, readDB, uid } from "./db";
import type { PublicUser, User } from "./types";

const COOKIE = "onekup_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30일

/**
 * 데모 연동 계정 시드 (mock 단계). 계정 스위처/전체 워크스페이스 화면을 데이터와 함께 보기 위함.
 * TODO(데이터 연결): 실제 인스타 OAuth 연동으로 교체하고 이 시드는 제거.
 */
function demoIgAccounts(now: number): User["igAccounts"] {
  return [
    {
      id: "ig_demo_my_cafe_daily",
      handle: "my_cafe_daily",
      mode: "테스터베타",
      connectedAt: now,
      followers: 248,
      weeklyPublished: 5,
      weeklyGrowth: 31,
      niche: "홈카페 · 데일리 감성",
    },
    {
      id: "ig_demo_cafe_dessert",
      handle: "cafe_dessert",
      mode: "테스터베타",
      connectedAt: now,
      followers: 96,
      weeklyPublished: 2,
      weeklyGrowth: 8,
      niche: "디저트 · 신메뉴 위주",
    },
  ];
}

export function newUser(partial: Partial<User> & { email: string; name: string }): User {
  const now = Date.now();
  return {
    id: uid("user"),
    email: partial.email,
    name: partial.name,
    passwordHash: partial.passwordHash ?? "",
    passwordSalt: partial.passwordSalt ?? "",
    guest: partial.guest ?? false,
    authProvider: partial.authProvider ?? "email",
    marketingConsent: partial.marketingConsent ?? false,
    plan: "베이직",
    billingCycle: "월",
    igAccounts: demoIgAccounts(now),
    activeIgAccountId: "ig_demo_my_cafe_daily",
    onboarded: false,
    createdAt: now,
  };
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _h, passwordSalt: _s, ...rest } = user;
  // 액세스 토큰은 클라이언트로 보내지 않는다(서버 전용)
  return {
    ...rest,
    igAccounts: rest.igAccounts.map((a) => ({ ...a, accessToken: a.accessToken ? "" : undefined })),
  };
}

export async function createSession(userId: string): Promise<void> {
  const token = uid("sess") + randomBytes(16).toString("hex");
  mutateDB((db) => {
    db.sessions.push({ token, userId, createdAt: Date.now() });
  });
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    mutateDB((db) => {
      db.sessions = db.sessions.filter((s) => s.token !== token);
    });
  }
  store.delete(COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const db = readDB();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) ?? null;
}

export async function requireUser(): Promise<User | null> {
  return getCurrentUser();
}
