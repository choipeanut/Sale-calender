import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { env } from "@/lib/env";

export interface RequestIdentity {
  userId: string;
  email?: string;
  isAdmin: boolean;
  source: "firebase" | "demo" | "bypass";
}

const demoIdentity: RequestIdentity = {
  userId: "demo-user",
  email: "demo@salecalendar.app",
  isAdmin: true,
  source: "demo",
};

export const resolveIdentity = async (): Promise<RequestIdentity | null> => {
  if (env.demoMode) {
    return demoIdentity;
  }

  const headerStore = await headers();
  const bypassHeader = headerStore.get("x-admin-bypass");

  if (env.adminBypassSecret && bypassHeader === env.adminBypassSecret) {
    return {
      userId: headerStore.get("x-user-id") ?? "bypass-user",
      email: headerStore.get("x-user-email") ?? "",
      isAdmin: true,
      source: "bypass",
    };
  }

  const authHeader = headerStore.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const adminAuth = getFirebaseAdminAuth();

  if (!adminAuth) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    return {
      userId: decoded.uid,
      email: decoded.email,
      isAdmin: Boolean(decoded.admin),
      source: "firebase",
    };
  } catch {
    return null;
  }
};

export const requireIdentity = async () => {
  const identity = await resolveIdentity();
  if (!identity) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }),
    };
  }

  return {
    ok: true as const,
    identity,
  };
};

export const requireAdminIdentity = async () => {
  const resolved = await requireIdentity();
  if (!resolved.ok) {
    return resolved;
  }

  if (!resolved.identity.isAdmin) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }),
    };
  }

  return resolved;
};
