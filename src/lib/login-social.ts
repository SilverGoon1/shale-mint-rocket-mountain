import { authClient, getBearerToken, signIn } from "@/lib/auth/client";
import { runPreSignInSignOut } from "../../scripts/sign-out-plan.mjs";

const BEARER_KEY = "grok-auth.bearer-token";

type PopupMessage = { source: "grok-auth-popup"; token: string | null; error?: string };

export function friendlyAuthError(err: unknown, hint?: { username?: boolean; signup?: boolean }): string {
  const raw = err instanceof Error ? err.message : "Sign-in failed.";
  const lower = raw.toLowerCase().replace(/_/g, " ");
  if (lower.includes("too many")) {
    return "Too many tries. Wait a few minutes and try again.";
  }
  if (lower.includes("already exists")) {
    return hint?.username
      ? "That username is already taken."
      : "An account with that email already exists. Sign in, or use Forgot password.";
  }
  if (lower.includes("redirect") && (lower.includes("uri") || lower.includes("url") || lower.includes("mismatch"))) {
    return "Google and X could not return to this shop. Try email, or open the published shop link.";
  }
  if (lower.includes("invalid origin")) {
    return "This shop address is not on the sign-in list. Open the published shop link and try again.";
  }
  if (lower.includes("pop-up") || lower.includes("popup")) {
    return "Allow pop-ups for this shop, then try Google or X again.";
  }
  if (lower.includes("cancelled") || lower.includes("canceled") || lower.includes("did not finish") || lower === "social") {
    return "Sign-in did not finish. Try again.";
  }
  if (
    lower.includes("could not send") ||
    lower.includes("email is not configured") ||
    lower.includes("code is already") ||
    lower.includes("cannot email")
  ) {
    return raw;
  }
  if (hint?.signup) {
    if (lower.includes("password") && (lower.includes("short") || lower.includes("least"))) {
      return "Password needs at least 8 characters.";
    }
    if (lower.includes("invalid email")) return "Enter a valid email address.";
    if (raw && raw !== "Sign-in failed.") return raw;
    return "Could not create the account. Try again, or use a different email.";
  }
  if (
    lower.includes("invalid") ||
    lower.includes("credential") ||
    lower.includes("unauthorized") ||
    lower.includes("not found")
  ) {
    return hint?.username ? "Invalid username or password." : "Invalid email, username, or password.";
  }
  return hint?.username ? "Invalid username or password." : "Invalid email, username, or password.";
}

function inSandboxPreview(): boolean {
  return typeof window !== "undefined" && window.location.hostname.endsWith(".grok-sandbox.com");
}

function pageIsFramed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function waitForPopupToken(popup: Window, origin: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let closeTimer: number | undefined;
    const settle = (token: string | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(token);
    };
    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(message));
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin) return;
      const data = event.data as PopupMessage | undefined;
      if (!data || data.source !== "grok-auth-popup") return;
      if (data.error && !data.token) {
        fail(data.error);
        return;
      }
      settle(data.token ?? null);
    };
    const pollTimer = window.setInterval(() => {
      if (!popup.closed) return;
      window.clearInterval(pollTimer);
      closeTimer = window.setTimeout(() => settle(null), 400);
    }, 300);
    function cleanup() {
      window.clearInterval(pollTimer);
      if (closeTimer !== undefined) window.clearTimeout(closeTimer);
      window.removeEventListener("message", onMessage);
    }
    window.addEventListener("message", onMessage);
  });
}

async function signInWithAuthPopup(providerId: string): Promise<void> {
  const origin = window.location.origin;
  const popup = window.open(
    `${origin}/auth/popup?providerId=${encodeURIComponent(providerId)}`,
    `southend-signin-${Date.now()}`,
    "popup,width=500,height=650",
  );
  await runPreSignInSignOut({
    livePreview: true,
    hasBearer: Boolean(getBearerToken()),
    requestSignOut: () => authClient.signOut(),
    clearToken: () => {
      try {
        window.sessionStorage.removeItem(BEARER_KEY);
      } catch {
        /* storage unavailable */
      }
    },
  });
  if (!popup) throw new Error("Pop-up blocked — allow pop-ups for Google and X sign-in.");
  const token = await waitForPopupToken(popup, origin);
  if (!token) throw new Error("Sign-in was cancelled or did not finish.");
  try {
    window.sessionStorage.setItem(BEARER_KEY, token);
  } catch {
    /* storage unavailable */
  }
  try {
    await authClient.getSession();
  } catch {
    /* session store will recover on next useSession fetch */
  }
}

/**
 * Google / X sign-in. The sandbox preview already popups from `signIn()`.
 * A GitHub live build inside an iframe is not that host, so Google/X block a
 * full-page redirect — open `/auth/popup` ourselves in that case.
 */
export async function startSocialSignIn(
  providerId: string,
  opts: { callbackURL: string; errorCallbackURL: string },
): Promise<void> {
  if (pageIsFramed() && !inSandboxPreview()) {
    await signInWithAuthPopup(providerId);
    return;
  }
  await signIn(providerId, opts);
}
