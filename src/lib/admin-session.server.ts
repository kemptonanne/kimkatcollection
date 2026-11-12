import { getRequestHeader, useSession } from "@tanstack/react-start/server";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { isIP } from "node:net";
import { shopAdmin } from "./shop-db.server";

type AdminSession = { unlocked?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "kimkat-admin",
    maxAge: 60 * 60 * 12,
    cookie: { httpOnly: true, secure: true, sameSite: "none" as const, path: "/" },
  };
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export async function reserveAdminLoginAttempt(): Promise<boolean> {
  const forwardedIp = getRequestHeader("x-vercel-forwarded-for")?.trim();
  const ip =
    process.env["VERCEL"] === "1" && forwardedIp && isIP(forwardedIp) ? forwardedIp : "unknown";
  const secret = process.env["SESSION_SECRET"];
  if (!secret) throw new Error("SESSION_SECRET is not set");
  const key = createHmac("sha256", secret).update(`admin-login:${ip}`).digest("hex");
  const { data, error } = await shopAdmin().rpc("reserve_admin_login_attempt", {
    p_client_key: key,
  });
  if (error) throw new Error("Sign-in is unavailable. Please try again.");
  return data === true;
}

export function passwordMatches(input: string): boolean {
  const expected = process.env["ADMIN_PASSWORD"];
  if (!expected) throw new Error("ADMIN_PASSWORD is not set");
  return timingSafeEqual(digest(input), digest(expected));
}

export async function unlockAdmin(): Promise<void> {
  const session = await useSession<AdminSession>(sessionConfig());
  await session.update({ unlocked: true });
}

export async function lockAdmin(): Promise<void> {
  const session = await useSession<AdminSession>(sessionConfig());
  await session.clear();
}

export async function isAdminUnlocked(): Promise<boolean> {
  const session = await useSession<AdminSession>(sessionConfig());
  return session.data.unlocked === true;
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminUnlocked())) {
    throw new Error("Admin password required.");
  }
}
