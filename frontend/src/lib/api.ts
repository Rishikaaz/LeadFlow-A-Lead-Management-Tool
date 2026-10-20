import { Lead, CreateLeadInput, UpdateLeadInput } from "../types/lead";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        if (typeof errorJson.detail === "string") {
          errorDetail = errorJson.detail;
        } else if (Array.isArray(errorJson.detail)) {
          errorDetail = errorJson.detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ");
        }
      }
    } catch {
      // ignore json parse error
    }
    throw new ApiError(errorDetail, res.status);
  }
  return res.json();
}

export async function fetchLeads(statusFilter?: string, search?: string): Promise<Lead[]> {
  const params = new URLSearchParams();
  if (statusFilter && statusFilter !== "All") {
    params.append("status", statusFilter);
  }
  if (search && search.trim()) {
    params.append("search", search.trim());
  }

  const queryString = params.toString();
  const url = `${API_BASE}/api/leads${queryString ? `?${queryString}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return handleResponse<Lead[]>(res);
}

export async function fetchLead(leadId: number): Promise<Lead> {
  const res = await fetch(`${API_BASE}/api/leads/${leadId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return handleResponse<Lead>(res);
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const res = await fetch(`${API_BASE}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Lead>(res);
}

export async function updateLead(leadId: number, input: UpdateLeadInput): Promise<Lead> {
  const res = await fetch(`${API_BASE}/api/leads/${leadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Lead>(res);
}

export async function addDiscussion(
  leadId: number,
  note: string,
  followUpAt?: string | null
): Promise<Lead> {
  const res = await fetch(`${API_BASE}/api/leads/${leadId}/discussions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      note,
      follow_up_at: followUpAt || null,
    }),
  });
  return handleResponse<Lead>(res);
}

export async function resetDatabaseSeed(): Promise<Lead[]> {
  const res = await fetch(`${API_BASE}/api/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<Lead[]>(res);
}
