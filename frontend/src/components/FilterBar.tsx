"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { LeadStatus } from "../types/lead";

interface FilterBarProps {
  currentFilter: string;
  onSelectFilter: (status: string) => void;
  statusCounts: Record<string, number>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: "All", value: "All" },
  { label: "New", value: "New" },
  { label: "Contacted", value: "Contacted" },
  { label: "Qualified", value: "Qualified" },
  { label: "Proposal Sent", value: "Proposal Sent" },
  { label: "Won", value: "Won" },
  { label: "Lost", value: "Lost" },
];

export function FilterBar({
  currentFilter,
  onSelectFilter,
  statusCounts,
  searchQuery,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="controls-bar">
      {/* Status Filter Pills */}
      <div className="filters-wrapper">
        <span className="filters-label">FILTERS:</span>
        {FILTER_OPTIONS.map((opt) => {
          const count = statusCounts[opt.value] || 0;
          const isActive = currentFilter === opt.value;
          return (
            <button
              key={opt.value}
              className={`filter-pill ${isActive ? "active" : ""}`}
              onClick={() => onSelectFilter(opt.value)}
              type="button"
            >
              <span>{opt.label}</span>
              <span className="filter-pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Bonus Search Bar */}
      <div className="search-wrapper">
        <Search size={16} className="search-icon" />
        <input
          id="search-leads-input"
          type="text"
          className="search-input"
          placeholder="Search leads by name or company..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => onSearchChange("")}
            title="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
