import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

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
