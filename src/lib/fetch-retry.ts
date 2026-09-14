export function isTransientFetchError(error: unknown) {
  if (!error) return false;
  const name = error instanceof Error ? error.name : "";
  const msg = error instanceof Error ? error.message : String(error);
  return (
    name === "AbortError" ||
    name === "TimeoutError" ||
    /failed to fetch|networkerror|network request failed|load failed|fetch failed|aborted|econnreset|socket/i.test(
      msg,
    )
  );
}

export function isUnauthorizedError(error: unknown) {
  if (!error) return false;
  const name = error instanceof Error ? error.name : "";
  const msg = error instanceof Error ? error.message : String(error);
  const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: unknown }).status) : 0;
  return name === "UnauthorizedError" || status === 401 || /unauthorized/i.test(msg);
}

export async function retryTransient<T>(fn: () => Promise<T>, tries = 5, delayMs = 350): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i += 1) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      if (!isTransientFetchError(error) || i === tries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  throw last;
}
