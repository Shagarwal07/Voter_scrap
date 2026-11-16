"use client";

import React, { useState, useEffect } from "react";

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  subscription_tier: string;
  allowed_wards: string;
  allowed_galis: string;
  created_at?: string;
}

interface UserDrawerProps {
  isOpen: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function UserDrawer({
  isOpen,
  user,
  onClose,
  onSuccess,
  onError,
}: UserDrawerProps) {
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("user");
  const [formTier, setFormTier] = useState("free");
  const [formWards, setFormWards] = useState("");
  const [formGalis, setFormGalis] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Metadata from SQLite
  const [availableWards, setAvailableWards] = useState<number[]>([]);
  const [availableGalis, setAvailableGalis] = useState<string[]>([]);
  const [availableGroupedGalis, setAvailableGroupedGalis] = useState<Record<string, string[]>>({});
  const [metaLoading, setMetaLoading] = useState(false);

  // Fetch dynamic wards and galis on mount
  useEffect(() => {
    if (isOpen) {
      setMetaLoading(true);
      fetch("/api/admin/users?meta=true")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAvailableWards(data.wards || []);
            setAvailableGalis(data.galis || []);
            setAvailableGroupedGalis(data.groupedGalis || {});
          }
        })
        .catch((err) => console.error("Failed to load admin metadata:", err))
        .finally(() => setMetaLoading(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      setFormName(user.name || "");
      setFormEmail(user.email || "");
      setFormRole(user.role || "user");
      setFormTier(user.subscription_tier || "free");
      setFormWards(user.allowed_wards || "");
      setFormGalis(user.allowed_galis || "");
    } else {
      setFormName("");
      setFormEmail("");
      setFormRole("user");
      setFormTier("free");
      setFormWards("");
      setFormGalis("");
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const roleDisplay: Record<string, { label: string; color: string }> = {
    developer: { label: "Lead Developer", color: "bg-[#1E2A42]" },
    admin: { label: "Campaign Admin", color: "bg-[#A2382B]" },
    user: { label: "Standard User", color: "bg-[#4A4536]" },
  };
  const roleInfo = roleDisplay[formRole] || roleDisplay.user;
  const initials = formName
    ? formName
        .split(" ")
        .map((n) => n.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : formEmail.charAt(0).toUpperCase();

  // Helpers for Ward Selection
  const selectedWardList = formWards === "all"
    ? ["all"]
    : formWards ? formWards.split(",").map((w) => w.trim()).filter(Boolean) : [];

  const handleToggleWard = (wardStr: string) => {
    if (!wardStr) return;
    if (wardStr === "all") {
      setFormWards("all");
      return;
    }
    let current = formWards === "all" ? [] : [...selectedWardList];
    if (current.includes(wardStr)) {
      current = current.filter((w) => w !== wardStr);
    } else {
      current = [...current, wardStr];
    }
    setFormWards(current.join(", "));
  };

  // Helpers for Gali Selection
  const selectedGaliList = formGalis === "all"
    ? ["all"]
    : formGalis ? formGalis.split(",").map((g) => g.trim()).filter(Boolean) : [];

  const handleToggleGali = (galiStr: string) => {
    if (!galiStr) return;
    if (galiStr === "all") {
      setFormGalis("all");
      return;
    }
    let current = formGalis === "all" ? [] : [...selectedGaliList];
    if (current.includes(galiStr)) {
      current = current.filter((g) => g !== galiStr);
    } else {
      current = [...current, galiStr];
    }
    setFormGalis(current.join(", "));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const method = user ? "PUT" : "POST";
      const payload = {
        id: user?.id,
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        role: formRole,
        subscription_tier: formTier,
        allowed_wards: formWards.trim(),
        allowed_galis: formGalis.trim(),
      };

      const res = await fetch("/api/admin/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save user");

      onSuccess(user ? "User credentials updated successfully!" : "User account created successfully!");
      onClose();
    } catch (err: any) {
      onError(err.message || "Failed to save user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-['Courier_Prime']">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1E2A42]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel (IWS Archival Theme) */}
      <div className="w-full max-w-lg bg-[#E9E1CC] h-full shadow-[8px_0_0_rgba(30,42,66,1)] relative border-l-4 border-[#1E2A42] flex flex-col z-10 text-[#24211A]">
        {/* Drawer Header — role-colored avatar */}
        <header className={`flex items-center gap-4 p-6 border-b-2 border-dashed border-[#1E2A42]/40 ${roleInfo.color} text-white`}>
          <div className="w-14 h-14 bg-white/20 text-white font-['Courier_Prime'] font-bold flex items-center justify-center text-xl border-2 border-white/30">
            {initials || "?"}
          </div>
          <div className="flex-1">
            <div className="text-[9px] uppercase tracking-widest opacity-80">
              AuthVault Dossier
            </div>
            <h3 className="text-2xl font-black font-['Fraunces'] tracking-tight">
              {user ? "Edit User Permissions" : "Create New App User"}
            </h3>
            <div className="text-xs opacity-85 mt-0.5">
              {roleInfo.label}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 font-bold border border-white/30 rounded-none shadow-[2px_2px_0_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all cursor-pointer text-lg"
            aria-label="Close"
          >
            &times;
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Name */}
          <div>
            <label className="block text-xs font-bold text-[#1E2A42] uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full bg-[#E1D7BC] border-2 border-[#1E2A42] p-3 text-sm text-[#1E2A42] focus:outline-none focus:ring-2 focus:ring-[#A2382B] shadow-inner font-['Lora']"
              placeholder="e.g. Ramesh Kumar Agrawal"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-[#1E2A42] uppercase tracking-wider mb-2">
              Email Address (Google Identity) *
            </label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              required
              className="w-full bg-[#E1D7BC] border-2 border-[#1E2A42] p-3 text-sm text-[#1E2A42] focus:outline-none focus:ring-2 focus:ring-[#A2382B] shadow-inner font-['Courier_Prime']"
              placeholder="volunteer@gmail.com"
            />
            <p className="text-[11px] text-[#6B6944] mt-1">
              Google OAuth identity or login email. Editable by administrators.
            </p>
          </div>

          {/* Role and Tier Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E2A42] uppercase tracking-wider mb-2">
                System Role
              </label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                className="w-full bg-[#E1D7BC] border-2 border-[#1E2A42] p-3 text-sm font-bold text-[#1E2A42] focus:outline-none focus:ring-2 focus:ring-[#A2382B] shadow-inner"
              >
                <option value="user">User (Standard)</option>
                <option value="admin">Campaign Admin</option>
                <option value="developer">Lead Developer</option>
              </select>
              <p className="text-[10px] text-[#6B6944] mt-1">
                {formRole === "developer"
                  ? "Full system access across all elections and wards."
                  : formRole === "admin"
                  ? "Manage users and configure permissions for paid accounts."
                  : "Standard search access. Upgrade to Paid or Admin for more."}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E2A42] uppercase tracking-wider mb-2">
                Subscription Tier
              </label>
              <select
                value={formTier}
                onChange={(e) => setFormTier(e.target.value)}
                className="w-full bg-[#E1D7BC] border-2 border-[#1E2A42] p-3 text-sm font-bold text-[#1E2A42] focus:outline-none focus:ring-2 focus:ring-[#A2382B] shadow-inner"
              >
                <option value="free">Free (Search Only)</option>
                <option value="paid">Paid (Streets + Reports)</option>
              </select>
              <p className="text-[10px] text-[#6B6944] mt-1">
                {formTier === "paid"
                  ? "Grants access to Gali Finder, PDF reports, and extended search."
                  : "Limited to Voter ID search. Name search requires sign-in."}
              </p>
            </div>
          </div>

          {/* Dynamic Allowed Wards (Filter 1) */}
          <div className="bg-[#E1D7BC] border-2 border-[#1E2A42] p-4 shadow-[3px_3px_0_rgba(30,42,66,0.15)]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#1E2A42] uppercase tracking-wider">
                Allowed Wards / Parts (Filter 1)
              </label>
              <div className="flex gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setFormWards("all")}
                  className={`px-2 py-0.5 font-bold border transition-colors ${
                    formWards === "all" ? "bg-[#1E2A42] text-white border-[#1E2A42]" : "bg-white text-[#1E2A42] border-[#1E2A42]/40 hover:bg-[#E9E1CC]"
                  }`}
                >
                  ALL
                </button>
                <button
                  type="button"
                  onClick={() => setFormWards("")}
                  className="px-2 py-0.5 font-bold bg-white text-[#A2382B] border border-[#1E2A42]/40 hover:bg-[#E9E1CC]"
                >
                  CLEAR (NULL)
                </button>
              </div>
            </div>

            {/* Quick-Pick Dynamic Ward Dropdown Selector */}
            <div className="mb-3">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleToggleWard(e.target.value);
                    e.target.value = "";
                  }
                }}
                disabled={metaLoading}
                className="w-full bg-[#E9E1CC] border-2 border-[#1E2A42] px-3 py-2.5 text-xs font-bold text-[#1E2A42] focus:outline-none cursor-pointer shadow-sm disabled:opacity-50"
              >
                <option value="">
                  {metaLoading ? "Loading wards from database..." : "-- Click to Select / Toggle Ward from Database --"}
                </option>
                <option value="all">{formWards === "all" ? "[Selected] All Wards & Parts (Unlimited)" : "Set All Wards & Parts"}</option>
                {availableWards.map((w) => {
                  const isSelected = selectedWardList.includes(w.toString());
                  return (
                    <option key={w} value={w.toString()}>
                      {isSelected ? "[SELECTED] " : ""}
                      {w <= 55 ? `Nagar Parishad Ward ${w}` : `Vidhan Sabha Part ${w}`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Active Selected Ward Badges */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-[#E9E1CC] border border-[#1E2A42]/30 mb-2">
              {formWards === "all" ? (
                <span className="px-2.5 py-0.5 bg-[#1E2A42] text-[#E9E1CC] text-xs font-bold border border-[#1E2A42]">
                  All Wards &amp; Parts Allowed
                </span>
              ) : selectedWardList.length > 0 ? (
                selectedWardList.map((w) => (
                  <span
                    key={w}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#A2382B]/10 text-[#A2382B] border border-[#A2382B] text-xs font-bold"
                  >
                    Ward {w}
                    <button
                      type="button"
                      onClick={() => handleToggleWard(w)}
                      className="hover:text-black font-black"
                    >
                      &times;
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-[#8A8575] italic">
                  No wards assigned (Default NULL: Access blocked until assigned).
                </span>
              )}
            </div>

            {/* Raw Input Value for Custom Comma-Separated Formatting */}
            <input
              type="text"
              value={formWards}
              onChange={(e) => setFormWards(e.target.value)}
              className="w-full bg-[#E9E1CC] border border-[#1E2A42]/40 px-3 py-1.5 text-xs text-[#1E2A42] font-mono focus:outline-none"
              placeholder="e.g. 5, 10, 31 or 'all'"
            />
            <p className="text-[10px] text-[#6B6944] mt-1">
              Queried dynamically from <code>voters.db</code> &amp; <code>vidhansabha.db</code> ({availableWards.length} total areas).
            </p>
          </div>

          {/* Dynamic Allowed Galis / Streets (Filter 2) */}
          <div className="bg-[#E1D7BC] border-2 border-[#1E2A42] p-4 shadow-[3px_3px_0_rgba(30,42,66,0.15)]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#1E2A42] uppercase tracking-wider">
                Allowed Streets &amp; Slips (Filter 2)
              </label>
              <div className="flex gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setFormGalis("all")}
                  className={`px-2 py-0.5 font-bold border transition-colors ${
                    formGalis === "all" ? "bg-[#1E2A42] text-white border-[#1E2A42]" : "bg-white text-[#1E2A42] border-[#1E2A42]/40 hover:bg-[#E9E1CC]"
                  }`}
                >
                  ALL
                </button>
                <button
                  type="button"
                  onClick={() => setFormGalis("")}
                  className="px-2 py-0.5 font-bold bg-white text-[#A2382B] border border-[#1E2A42]/40 hover:bg-[#E9E1CC]"
                >
                  CLEAR (NULL)
                </button>
              </div>
            </div>

            {/* Quick-Pick Dynamic Gali & Slip Dropdown Selector */}
            <div className="mb-3">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleToggleGali(e.target.value);
                    e.target.value = "";
                  }
                }}
                disabled={metaLoading}
                className="w-full bg-[#E9E1CC] border-2 border-[#1E2A42] px-3 py-2.5 text-xs font-bold text-[#1E2A42] focus:outline-none cursor-pointer shadow-sm disabled:opacity-50"
              >
                <option value="">
                  {metaLoading ? "Loading streets from database..." : "-- Click to Select / Toggle Street or Slip from Database --"}
                </option>
                <option value="all">{formGalis === "all" ? "[Selected] All Streets & Slips (Unlimited)" : "Set All Streets & Slips"}</option>
                {Object.keys(availableGroupedGalis).length > 0 ? (
                  Object.entries(availableGroupedGalis).map(([groupName, items]) => (
                    <optgroup key={groupName} label={`--- ${groupName} ---`} className="font-bold text-[#1E2A42]">
                      {items.map((g) => {
                        const isSelected = selectedGaliList.includes(g);
                        return (
                          <option key={g} value={g} className="font-normal">
                            {isSelected ? "[SELECTED] " : ""}
                            {g}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))
                ) : (
                  availableGalis.map((g) => {
                    const isSelected = selectedGaliList.includes(g);
                    return (
                      <option key={g} value={g}>
                        {isSelected ? "[SELECTED] " : ""}
                        {g}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            {/* Active Selected Gali Badges */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-[#E9E1CC] border border-[#1E2A42]/30 mb-2 max-h-32 overflow-y-auto">
              {formGalis === "all" ? (
                <span className="px-2.5 py-0.5 bg-[#1E2A42] text-[#E9E1CC] text-xs font-bold border border-[#1E2A42]">
                  All Streets &amp; Slips Allowed
                </span>
              ) : selectedGaliList.length > 0 ? (
                selectedGaliList.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#1E2A42]/10 text-[#1E2A42] border border-[#1E2A42] text-xs font-bold"
                  >
                    {g}
                    <button
                      type="button"
                      onClick={() => handleToggleGali(g)}
                      className="hover:text-[#A2382B] font-black"
                    >
                      &times;
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-[#8A8575] italic">
                  No streets assigned (Default NULL: Street Finder access blocked until assigned).
                </span>
              )}
            </div>

            {/* Raw Input Value for Custom Comma-Separated Formatting */}
            <input
              type="text"
              value={formGalis}
              onChange={(e) => setFormGalis(e.target.value)}
              className="w-full bg-[#E9E1CC] border border-[#1E2A42]/40 px-3 py-1.5 text-xs text-[#1E2A42] font-mono focus:outline-none"
              placeholder="e.g. Gali 1, Main Bazaar or 'all'"
            />
            <p className="text-[10px] text-[#6B6944] mt-1">
              Queried dynamically from <code>houses.db</code> &amp; <code>vidhansabha_house.db</code> ({availableGalis.length} total streets &amp; slips).
            </p>
          </div>
        </form>

        {/* Drawer Footer Actions */}
        <footer className="p-6 border-t-2 border-[#1E2A42] bg-[#E1D7BC] flex gap-3">
          <button
            onClick={onClose}
            type="button"
            className="flex-1 bg-[#E9E1CC] border-2 border-[#1E2A42] text-[#1E2A42] py-3 font-bold text-xs uppercase shadow-[2px_2px_0_rgba(30,42,66,1)] hover:bg-white transition-all active:translate-y-0.5 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-[#1E2A42] text-[#E9E1CC] py-3 font-bold text-xs uppercase border-2 border-[#1E2A42] shadow-[3px_3px_0_rgba(162,56,43,1)] hover:bg-[#A2382B] transition-all disabled:opacity-50 active:translate-y-0.5 cursor-pointer"
          >
            {isSubmitting ? "Saving..." : user ? "Update Permissions" : "Create User"}
          </button>
        </footer>
      </div>
    </div>
  );
}
