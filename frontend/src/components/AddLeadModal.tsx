"use client";

import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { CreateLeadInput } from "../types/lead";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLead: (data: CreateLeadInput) => Promise<void>;
}

export function AddLeadModal({ isOpen, onClose, onSaveLead }: AddLeadModalProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [initialNote, setInitialNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSaveLead({
        name: name.trim(),
        company: company.trim() || undefined,
        phone: phone.trim() || undefined,
        initial_note: initialNote.trim() || undefined,
        status: "New",
      });
      // Reset form & close
      setName("");
      setCompany("");
      setPhone("");
      setInitialNote("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create lead.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: "480px" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-add-title"
      >
        <div className="modal-header">
          <span id="modal-add-title" className="modal-lead-name">
            Add New Lead
          </span>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            title="Cancel and close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-form">
            {error && (
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
                }}
              >
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="lead-name-input" className="form-label">
                Full Name <span className="required-star">*</span>
              </label>
              <input
                id="lead-name-input"
                type="text"
                className="form-input"
                placeholder="e.g., John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lead-company-input" className="form-label">
                Company <span className="optional-tag">(Optional)</span>
              </label>
              <input
                id="lead-company-input"
                type="text"
                className="form-input"
                placeholder="e.g., Stark Industries"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lead-phone-input" className="form-label">
                Phone <span className="optional-tag">(Optional)</span>
              </label>
              <input
                id="lead-phone-input"
                type="tel"
                className="form-input"
                placeholder="e.g., 555-0123"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lead-note-input" className="form-label">
                Initial Discussion Note <span className="optional-tag">(Optional)</span>
              </label>
              <input
                id="lead-note-input"
                type="text"
                className="form-input"
                placeholder="e.g., Inbound lead from website contact form."
                value={initialNote}
                onChange={(e) => setInitialNote(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-buttons-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              id="btn-save-new-lead"
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
