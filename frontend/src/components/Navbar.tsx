"use client";

import React from "react";
import { TrendingUp, Plus, RotateCcw } from "lucide-react";

interface NavbarProps {
  onOpenAddModal: () => void;
  onResetSeed: () => void;
  isResetting?: boolean;
}

export function Navbar({ onOpenAddModal, onResetSeed, isResetting }: NavbarProps) {
  return (
    <header className="header-bar">
      <div className="brand-logo">
        <div className="brand-icon-wrapper">
          <TrendingUp size={20} strokeWidth={2.5} />
        </div>
        <span>LeadFlow</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          className="btn-seed"
          onClick={onResetSeed}
          disabled={isResetting}
          title="Reset sample leads to original demo state"
        >
          <RotateCcw size={14} className={isResetting ? "spin" : ""} />
          <span>{isResetting ? "Resetting..." : "Reset Demo"}</span>
        </button>

        <button
          id="btn-add-lead"
          className="btn-primary"
          onClick={onOpenAddModal}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add New Lead</span>
        </button>
      </div>
    </header>
  );
}
