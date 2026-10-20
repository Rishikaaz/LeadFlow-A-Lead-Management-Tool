"use client";

import React from "react";
import { Bell, AlertCircle, Calendar } from "lucide-react";
import { Lead } from "../types/lead";
import { formatRelativeTime, formatTimeOnly, formatDateTime, isToday, isOverdue } from "../lib/dateUtils";

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
  isPinnedToday?: boolean;
  isPinnedOverdue?: boolean;
}

export function LeadCard({ lead, onClick, isPinnedToday, isPinnedOverdue }: LeadCardProps) {
  // Format status badge class
  const statusSlug = lead.status.toLowerCase().replace(/\s+/g, "-");
  const badgeClass = `status-badge badge-${statusSlug}`;

  // Time ago calculation
  const relativeTime = formatRelativeTime(lead.last_discussion_at || lead.updated_at);
  const lastNoteText = lead.last_discussion_note || "No discussions recorded yet.";

  // Follow-up evaluation
  const hasFollowUp = Boolean(lead.follow_up_at);
  const followUpIsToday = isToday(lead.follow_up_at);
  const followUpIsOverdue = isOverdue(lead.follow_up_at) && !followUpIsToday && lead.status !== "Won" && lead.status !== "Lost";

  // Card classes
  let cardClass = "lead-card";
  if (isPinnedToday || followUpIsToday) {
    cardClass += " today-pinned";
  } else if (isPinnedOverdue || followUpIsOverdue) {
    cardClass += " overdue-pinned";
  }

  return (
    <div
      className={cardClass}
      onClick={() => onClick(lead)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(lead);
        }
      }}
    >
      <div className="lead-card-header">
        <div className="lead-name-group">
          <span className="lead-name">{lead.name}</span>
          {lead.company && <span className="lead-company">({lead.company})</span>}
        </div>
        <span className={badgeClass}>{lead.status}</span>
      </div>

      <div className="lead-card-body">
        <span className="note-label">Last Note:</span> {lastNoteText}
        {relativeTime && <span className="time-ago">{relativeTime}</span>}
      </div>

      {hasFollowUp && (
        <div>
          {followUpIsToday ? (
            <div className="followup-pill today">
              <Bell size={13} strokeWidth={2.5} />
              <span>Follow-up today at {formatTimeOnly(lead.follow_up_at)}</span>
            </div>
          ) : followUpIsOverdue ? (
            <div className="followup-pill overdue">
              <AlertCircle size={13} strokeWidth={2.5} />
              <span>Overdue follow-up: {formatDateTime(lead.follow_up_at)}</span>
            </div>
          ) : (
            <div className="followup-pill upcoming">
              <Calendar size={13} strokeWidth={2} />
              <span>Follow-up: {formatDateTime(lead.follow_up_at)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
