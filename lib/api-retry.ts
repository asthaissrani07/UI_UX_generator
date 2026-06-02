import axios from "axios";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function postGenerateWithModelRotation<T>(
  url: string,
  buildPayload: (modelAttempt: number) => Record<string, unknown>,
  maxAttempts = 3
): Promise<T> {
  let last: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { data } = await axios.post<T>(url, buildPayload(attempt), {
        timeout: 28000,
      });
      return data;
    } catch (err) {
      last = err;
      const status = axios.isAxiosError(err) ? (err.response?.status ?? 0) : 0;
      if (attempt < maxAttempts - 1 && [502, 503, 504, 500].includes(status)) {
        await sleep(4000);
        continue;
      }
      throw err;
    }
  }
  throw last;
}
