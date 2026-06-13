const API_BASE = process.env.NEXT_PUBLIC_MOSIP_API_BASE ?? "http://localhost:8000";

type FetchOptions = RequestInit & {
  timeoutMs?: number;
};

async function requestJson<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12000);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `MOSIP API returned ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export type AssessmentPayload = {
  satellite?: any;
  orbital_analysis?: any;
  collision_analysis?: any;
  compliance_analysis?: any;
  sustainability_analysis?: any;
  forecast?: any;
  mitigation_analysis?: any;
  recommendations?: any[];
  report?: string;
  agent_timeline?: any[];
  status?: string;
  errors?: string[];
};

export type RawMissionPayload = {
  altitude_km: number;
  inclination: number;
  debris_density: number;
  conjunction_frequency: number;
  eccentricity: number;
};

export async function assessNorad(noradId: string) {
  return requestJson<AssessmentPayload>(`/assess/${encodeURIComponent(noradId)}`, {
    timeoutMs: 45000,
  });
}

export async function assessRaw(payload: RawMissionPayload) {
  return requestJson<AssessmentPayload>("/assess/raw", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: 45000,
  });
}

export async function searchRegulations(query: string) {
  return requestJson<{ results?: unknown[] }>(
    `/regulations/search?q=${encodeURIComponent(query)}`,
    { timeoutMs: 15000 },
  );
}
