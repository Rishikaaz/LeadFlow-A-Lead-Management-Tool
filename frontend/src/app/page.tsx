"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Navbar } from "../components/Navbar";
import { FilterBar } from "../components/FilterBar";
import { LeadCard } from "../components/LeadCard";
import { LeadTimelineModal } from "../components/LeadTimelineModal";
import { AddLeadModal } from "../components/AddLeadModal";
import { Lead, LeadStatus, CreateLeadInput } from "../types/lead";
import { fetchLeads, fetchLead, updateLead, addDiscussion, createLead, resetDatabaseSeed } from "../lib/api";
import { isToday, isOverdue } from "../lib/dateUtils";
import { CheckCircle2, AlertTriangle, Users } from "lucide-react";

export default function LeadFlowPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  }, []);

  // Fetch all leads on mount
  const loadLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchLeads();
      setLeads(data);
    } catch (err: any) {
      console.error("Error loading leads:", err);
      showToast("Unable to connect to backend API. Please make sure the server is running.");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Compute status counts for filter pills (independent of current filter)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: leads.length,
      New: 0,
      Contacted: 0,
      Qualified: 0,
      "Proposal Sent": 0,
      Won: 0,
      Lost: 0,
    };
    for (const lead of leads) {
      if (counts[lead.status] !== undefined) {
        counts[lead.status] += 1;
      }
    }
    return counts;
  }, [leads]);

  // Filter leads based on selectedFilter and searchQuery
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Filter by status
      if (selectedFilter !== "All" && lead.status !== selectedFilter) {
        return false;
      }
      // Filter by search query (name or company)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = lead.name.toLowerCase().includes(q);
        const matchesCompany = lead.company ? lead.company.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesCompany) {
          return false;
        }
      }
      return true;
    });
  }, [leads, selectedFilter, searchQuery]);

  // Group leads into: Today's Follow-ups, Overdue Follow-ups, and All Other Leads
  const { todayFollowUps, overdueFollowUps, regularLeads } = useMemo(() => {
    const today: Lead[] = [];
    const overdue: Lead[] = [];
    const regular: Lead[] = [];

    for (const lead of filteredLeads) {
      const followUpToday = isToday(lead.follow_up_at);
      const followUpOverdue = isOverdue(lead.follow_up_at) && !followUpToday && lead.status !== "Won" && lead.status !== "Lost";

      if (followUpToday) {
        today.push(lead);
      } else if (followUpOverdue) {
        overdue.push(lead);
      } else {
        regular.push(lead);
      }
    }

    return {
      todayFollowUps: today,
      overdueFollowUps: overdue,
      regularLeads: regular,
    };
  }, [filteredLeads]);

  // Handle clicking a lead to open timeline modal
  async function handleLeadClick(lead: Lead) {
    setActiveLead(lead);
    setIsTimelineOpen(true);
    // Fetch fresh timeline detail to ensure all discussions are synced
    try {
      const freshDetail = await fetchLead(lead.id);
      setActiveLead(freshDetail);
    } catch (err) {
      console.error("Error refreshing lead details:", err);
    }
  }

  // Handle updating status from dialog
  async function handleUpdateStatus(leadId: number, newStatus: LeadStatus) {
    const updated = await updateLead(leadId, { status: newStatus });
    // Update local leads list
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    // Update active modal lead
    setActiveLead(updated);
    showToast(`Status updated to "${newStatus}"`);
  }

  // Handle adding new discussion note + optional follow up
  async function handleAddDiscussion(leadId: number, note: string, followUpAt?: string | null) {
    const updated = await addDiscussion(leadId, note, followUpAt);
    // Update local leads list immediately
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    // Update active modal lead so discussion appears in reverse chronological order
    setActiveLead(updated);
    showToast(followUpAt ? "Discussion logged & follow-up scheduled." : "Discussion note logged.");
  }

  // Handle creating a new lead
  async function handleSaveNewLead(data: CreateLeadInput) {
    const newLead = await createLead(data);
    setLeads((prev) => [newLead, ...prev]);
    showToast(`Lead "${newLead.name}" added successfully.`);
  }

  // Handle resetting demo data
  async function handleResetDemo() {
    try {
      setIsResetting(true);
      const resetLeads = await resetDatabaseSeed();
      setLeads(resetLeads);
      showToast("Demo data successfully reset to default state.");
    } catch (err: any) {
      showToast(err.message || "Failed to reset demo data.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="container">
      {/* Top Navbar */}
      <Navbar
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onResetSeed={handleResetDemo}
        isResetting={isResetting}
      />

      {/* Filter and Search Bar */}
      <FilterBar
        currentFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
        statusCounts={statusCounts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Loading state */}
      {isLoading && leads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">Loading Leads...</div>
          <div className="empty-state-desc">Fetching pipeline from Pravar AI backend</div>
        </div>
      ) : filteredLeads.length === 0 ? (
        /* Empty search/filter state */
        <div className="empty-state">
          <Users size={36} className="empty-state-icon" />
          <div className="empty-state-title">No leads match your filter</div>
          <div className="empty-state-desc">
            Try choosing a different status filter or clearing your search query.
          </div>
        </div>
      ) : (
        <>
          {/* Section: Today's Follow-ups (Pinned at the top) */}
          {todayFollowUps.length > 0 && (
            <section className="section-wrapper" aria-label="Today's Follow-ups">
              <div className="section-header">
                <span>📌 TODAY&apos;S FOLLOW-UPS</span>
              </div>
              <div className="leads-grid">
                {todayFollowUps.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onClick={handleLeadClick}
                    isPinnedToday={true}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Bonus Section: Overdue Follow-ups (Pinned and highlighted in red) */}
          {overdueFollowUps.length > 0 && (
            <section className="section-wrapper" aria-label="Overdue Follow-ups">
              <div className="section-header danger">
                <AlertTriangle size={14} />
                <span>OVERDUE FOLLOW-UPS</span>
              </div>
              <div className="leads-grid">
                {overdueFollowUps.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onClick={handleLeadClick}
                    isPinnedOverdue={true}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section: All Other Leads */}
          <section className="section-wrapper" aria-label="All Leads">
            <div className="section-header">
              <span>
                {todayFollowUps.length > 0 || overdueFollowUps.length > 0
                  ? "ALL LEADS"
                  : selectedFilter === "All"
                  ? "ALL LEADS"
                  : `${selectedFilter.toUpperCase()} LEADS`}
              </span>
            </div>

            {regularLeads.length > 0 ? (
              <div className="leads-grid">
                {regularLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onClick={handleLeadClick}
                  />
                ))}
              </div>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: "13.5px", padding: "12px 0" }}>
                All leads currently have today&apos;s or overdue reminders above.
              </div>
            )}
          </section>
        </>
      )}

      {/* Lead Timeline Dialog Modal */}
      <LeadTimelineModal
        lead={activeLead}
        isOpen={isTimelineOpen}
        onClose={() => {
          setIsTimelineOpen(false);
          setActiveLead(null);
        }}
        onUpdateStatus={handleUpdateStatus}
        onAddDiscussion={handleAddDiscussion}
      />

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveLead={handleSaveNewLead}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <CheckCircle2 size={16} style={{ color: "#4ADE80" }} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
