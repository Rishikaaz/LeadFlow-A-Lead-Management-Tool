export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Proposal Sent"
  | "Won"
  | "Lost";

export interface Discussion {
  id: number;
  lead_id: number;
  note: string;
  follow_up_at: string | null;
  created_at: string;
}

export interface Lead {
  id: number;
  name: string;
  company: string;
  phone: string;
  status: LeadStatus;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  last_discussion_note?: string | null;
  last_discussion_at?: string | null;
  discussions: Discussion[];
}

export interface CreateLeadInput {
  name: string;
  company?: string;
  phone?: string;
  status?: LeadStatus;
  initial_note?: string;
  follow_up_at?: string | null;
}

export interface UpdateLeadInput {
  name?: string;
  company?: string;
  phone?: string;
  status?: LeadStatus;
  follow_up_at?: string | null;
}

export interface CreateDiscussionInput {
  note: string;
  follow_up_at?: string | null;
}
