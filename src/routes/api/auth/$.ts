import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

const AUTH_LIMIT_PATH = /\/(sign-in|sign-up)\/email$|\/forget-password$|\/request-password-reset$/;

async function handleAuth(request: Request) {
  const path = new URL(request.url).pathname;
  if (request.method === "POST" && AUTH_LIMIT_PATH.test(path)) {
    let identity = "unknown";
    try {
      const body = (await request.clone().json()) as Record<string, unknown>;
      identity = String(body.email ?? body.phone ?? body.identifier ?? "").trim().toLowerCase() || "unknown";
    } catch {
      identity = "unknown";
    }
    const { consumeAuthAttempt, TooManyAttemptsError, tooManyResponse } = await import("@/lib/rate-limit.server");
    try {
      const { getSql } = await import("@/lib/db");
      await consumeAuthAttempt(await getSql(), identity);
    } catch (err) {
      if (err instanceof TooManyAttemptsError) return tooManyResponse();
      throw err;
    }
  }
  return auth.handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => handleAuth(request),
    },
  },
});