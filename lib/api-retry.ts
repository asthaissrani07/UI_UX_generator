import axios from "axios";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type RetryOptions = {
  maxAttempts?: number;
  retryStatuses?: number[];
  timeoutMs?: number;
};

type RequestPayload = Record<string, unknown>;

/** Retries with modelAttempt 0,1,2… so each call uses a different AI model. */
export async function postGenerateWithModelRotation<T>(
  url: string,
  buildPayload: (modelAttempt: number) => RequestPayload,
  options: RetryOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 5;
  const retryStatuses = options.retryStatuses ?? [500, 502, 503, 504];
  const timeoutMs = options.timeoutMs ?? 25_000;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { data } = await axios.post<T>(url, buildPayload(attempt), {
        timeout: timeoutMs,
      });
      return data;
    } catch (err) {
      lastError = err;
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const canRetry =
        attempt < maxAttempts - 1 &&
        (retryStatuses.includes(status ?? 0) ||
          (axios.isAxiosError(err) &&
            (err.code === "ECONNABORTED" || err.code === "ERR_NETWORK")));

      if (canRetry) {
        await sleep(1500 + attempt * 1000);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

/** Simple POST retry (same payload every time). */
export async function postWithRetry<T>(
  url: string,
  data: unknown,
  options: RetryOptions = {}
): Promise<T> {
  return postGenerateWithModelRotation<T>(url, () =>
    typeof data === "object" && data !== null
      ? (data as RequestPayload)
      : { data }
  , options);
}
