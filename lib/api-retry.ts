import axios from "axios";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type RetryOptions = {
  maxAttempts?: number;
  retryStatuses?: number[];
  timeoutMs?: number;
};

/** Retries POST on gateway timeouts — common on Vercel Hobby (10s limit). */
export async function postWithRetry<T>(
  url: string,
  data: unknown,
  options: RetryOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const retryStatuses = options.retryStatuses ?? [502, 503, 504];
  const timeoutMs = options.timeoutMs ?? 120_000;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data: result } = await axios.post<T>(url, data, {
        timeout: timeoutMs,
      });
      return result;
    } catch (err) {
      lastError = err;
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const canRetry =
        attempt < maxAttempts &&
        (retryStatuses.includes(status ?? 0) ||
          (axios.isAxiosError(err) && err.code === "ECONNABORTED"));

      if (canRetry) {
        await sleep(2500 * attempt);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}
