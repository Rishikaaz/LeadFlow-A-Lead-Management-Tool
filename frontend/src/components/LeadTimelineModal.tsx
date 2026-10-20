"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Phone, ChevronDown, Check, Calendar, Clock, AlertCircle } from "lucide-react";
import { Lead, LeadStatus } from "../types/lead";
import { formatRelativeTime, formatDateTime } from "../lib/dateUtils";

interface LeadTimelineModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (leadId: number, newStatus: LeadStatus) => Promise<void>;
  onAddDiscussion: (leadId: number, note: string, followUpAt?: string | null) => Promise<void>;
}

const ALL_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
  "Lost",
];

export function LeadTimelineModal({
  lead,
  isOpen,
  onClose,
  onUpdateStatus,
  onAddDiscussion,
}: LeadTimelineModalProps) {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isFollowUpEnabled, setIsFollowUpEnabled] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    if (isStatusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isStatusDropdownOpen]);

  // Reset form when active lead changes
  useEffect(() => {
    setNoteText("");
    setIsFollowUpEnabled(false);
    setFollowUpDate("");
    setFollowUpTime("");
    setErrorMessage("");
    setIsStatusDropdownOpen(false);
  }, [lead?.id]);

  if (!isOpen || !lead) return null;

  async function handleStatusSelect(status: LeadStatus) {
    if (!lead) return;
    setIsStatusDropdownOpen(false);
    try {
      await onUpdateStatus(lead.id, status);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update status.");
    }
  }

  async function handleSubmitDiscussion(e: React.FormEvent) {
    e.preventDefault();
    if (!lead || !noteText.trim()) return;

    let combinedFollowUp: string | null = null;
    if (isFollowUpEnabled) {
      if (!followUpDate) {
        setErrorMessage("Please select a follow-up date.");
        return;
      }
      const timeToUse = followUpTime || "09:00";
      // Construct ISO string
      const dateObj = new Date(`${followUpDate}T${timeToUse}:00`);
      if (isNaN(dateObj.getTime())) {
        setErrorMessage("Invalid date or time selected.");
        return;
      }
      combinedFollowUp = dateObj.toISOString();
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await onAddDiscussion(lead.id, noteText.trim(), combinedFollowUp);
      setNoteText("");
      setIsFollowUpEnabled(false);
      setFollowUpDate("");
      setFollowUpTime("");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save discussion note.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-lead-name"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-title-row">
              <span id="dialog-lead-name" className="modal-lead-name">
                {lead.name}
              </span>
              {lead.company && (
                <span className="modal-lead-company">({lead.company})</span>
              )}
            </div>

            {lead.phone ? (
              <div className="modal-phone-row">
                <Phone size={13} />
                <a href={`tel:${lead.phone}`} className="modal-phone-link">
                  {lead.phone}
                </a>
              </div>
            ) : (
              <div className="modal-phone-row" style={{ color: "#94a3b8" }}>
                <Phone size={13} />
                <span>No phone logged</span>
              </div>
            )}
          </div>

          <div className="modal-header-actions">
            {/* Status Dropdown */}
            <div className="status-dropdown-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className="status-dropdown-trigger"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                aria-expanded={isStatusDropdownOpen}
              >
                <span>{lead.status}</span>
                <ChevronDown size={14} />
              </button>

              {isStatusDropdownOpen && (
                <div className="status-dropdown-menu">
                  {ALL_STATUSES.map((status) => {
                    const isSelected = lead.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        className={`status-dropdown-item ${isSelected ? "active" : ""}`}
                        onClick={() => handleStatusSelect(status)}
                      >
                        <span>{status}</span>
                        {isSelected && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              title="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Timeline Body */}
        <div className="timeline-scroll-area">
          {errorMessage && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                backgroundColor: "#FEE2E2",
                color: "#991B1B",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              <AlertCircle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="timeline-container">
            {lead.discussions && lead.discussions.length > 0 ? (
              lead.discussions.map((discussion, index) => {
                const isLatest = index === 0;
                const formattedDate = formatDateTime(discussion.created_at);
                const relativeTime = formatRelativeTime(discussion.created_at);
                const isCreation = discussion.note.toLowerCase().includes("lead created");

                return (
                  <div key={discussion.id} className="timeline-item">
                    <div className={`timeline-dot ${isLatest ? "active" : ""}`} />
                    
                    <div className="timeline-item-header">
                      <span>{formattedDate}</span>
                      {relativeTime && (
                        <span className="timeline-relative">({relativeTime})</span>
                      )}
                    </div>

                    <div className={`timeline-card ${isCreation ? "initial-note" : ""}`}>
                      <p>{discussion.note}</p>

                      {discussion.follow_up_at && (
                        <div className="timeline-followup-badge">
                          <Calendar size={12} />
                          <span>
                            Follow-up set for: {formatDateTime(discussion.follow_up_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: "#64748B", fontSize: "13.5px" }}>
                No discussion history yet.
              </div>
            )}
          </div>
        </div>

        {/* Discussion Form Footer */}
        <form className="modal-footer-form" onSubmit={handleSubmitDiscussion}>
          <textarea
            className="discussion-textarea"
            placeholder="Log a new discussion..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={2}
          />

          <div className="modal-form-actions-row">
            <div className="followup-controls-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isFollowUpEnabled}
                  onChange={(e) => setIsFollowUpEnabled(e.target.checked)}
                />
                <span>Set Follow-up</span>
              </label>

              {isFollowUpEnabled && (
                <>
                  <input
                    type="date"
                    className="date-input"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                  <input
                    type="time"
                    className="time-input"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                  />
                </>
              )}
            </div>

            <button
              type="submit"
              className="btn-dark"
              disabled={isSubmitting || !noteText.trim()}
            >
              {isSubmitting ? "Saving..." : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
