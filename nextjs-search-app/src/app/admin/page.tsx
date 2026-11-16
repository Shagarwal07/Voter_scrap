"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UserDrawer, { AdminUser } from "@/components/admin/UserDrawer";
import Footer from "@/components/Footer";
import { checkSuperUser } from "@/utils/auth";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Drawer modal state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const role = (session?.user as any)?.role || "user";
  const { isSuperUser: isAuthorized } = checkSuperUser(session?.user);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if (!isAuthorized) {
        router.push("/");
      } else {
        fetchUsers();
      }
    }
  }, [status, isAuthorized, router, fetchUsers]);

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to delete ${user.email}? This action cannot be undone.`)) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/users?id=${user.id}&email=${encodeURIComponent(user.email)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      setSuccess("User deleted successfully!");
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.size === 0) return;
    const count = selectedUserIds.size;
    const plural = count === 1 ? "this user" : `${count} users`;
    if (!confirm(`Delete ${plural}? This action cannot be undone.`)) return;

    setError("");
    setSuccess("");
    setIsBulkDeleting(true);

    try {
      const deletePromises = Array.from(selectedUserIds).map((id) => {
        const user = users.find((u) => u.id === id);
        return fetch(`/api/admin/users?id=${id}&email=${encodeURIComponent(user?.email || "")}`, {
          method: "DELETE",
        });
      });

      const results = await Promise.allSettled(deletePromises);
      const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok));
      if (failed.length > 0) {
        setError(`${failed.length} deletion(s) failed or were rejected by server.`);
        fetchUsers();
      } else {
        setSuccess(`${count} user${count > 1 ? "s" : ""} deleted successfully!`);
        setSelectedUserIds(new Set());
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Filtered User List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      const isSuper = u.role === "admin" || u.role === "developer";
      const isPaidUser = !isSuper && (u.subscription_tier === "paid" || u.role === "paid");

      if (filterTier === "paid") return isPaidUser;
      if (filterTier === "free") return !isSuper && !isPaidUser;
      if (filterTier === "unassigned") {
        return isPaidUser && (!u.allowed_wards || !u.allowed_galis);
      }
      return true;
    });
  }, [users, searchTerm, filterTier]);

  // Aggregate Stats (Developer and Admin are Superusers, NEVER counted as Paid Subscribers)
  const totalUsers = users.length;
  const superusersCount = users.filter((u) => u.role === "developer" || u.role === "admin").length;
  const paidSubscribers = users.filter((u) => {
    const isSuper = u.role === "developer" || u.role === "admin";
    return !isSuper && (u.subscription_tier === "paid" || u.role === "paid");
  }).length;
  const unassignedPaid = users.filter((u) => {
    const isSuper = u.role === "developer" || u.role === "admin";
    const isPaidUser = !isSuper && (u.subscription_tier === "paid" || u.role === "paid");
    return isPaidUser && (!u.allowed_wards || !u.allowed_galis);
  }).length;

  if (status === "loading" || loading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#E9E1CC] flex flex-col items-center justify-center p-6 text-center font-['Courier_Prime']">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E2A42] mb-4" />
        <p className="text-[#1E2A42] font-bold text-sm uppercase tracking-wider">
          {status === "loading" || loading ? "Verifying administrative authorization..." : "Access Restricted"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E9E1CC] text-[#24211A] font-['Lora'] flex flex-col pt-6 md:pt-10">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500;1,9..144,600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Courier+Prime:wght@400;700&display=swap');
      `,
        }}
      />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 flex-1">
        {/* Navigation Breadcrumb & Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-6 border-b-2 border-dashed border-[#1E2A42]/30 font-['Courier_Prime'] text-xs">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-[#1E2A42] font-bold hover:text-[#A2382B] flex items-center gap-1.5 transition-colors text-sm"
            >
              <span>&larr;</span> RETURN TO SEARCH PORTAL
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="font-bold text-[#A2382B] uppercase text-xs break-all sm:break-normal">
              {session?.user?.email} ({role?.toUpperCase()})
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-3 py-1 bg-[#A2382B] text-[#E9E1CC] font-bold text-xs uppercase hover:bg-[#1E2A42] transition-colors shadow-[2px_2px_0_rgba(30,42,66,1)] cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Master Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-double border-[#1E2A42] pb-6">
          <div>
            <div className="inline-block bg-[#1E2A42] text-[#E9E1CC] font-bold text-[10px] tracking-widest uppercase px-2 py-1 mb-2 font-['Courier_Prime']">
              CONFIDENTIAL • ACCESS CONTROL ROSTER
            </div>
            <h1 className="font-['Fraunces'] font-black text-4xl md:text-5xl text-[#1E2A42] tracking-tight leading-none">
              AuthVault <span className="text-[#A2382B]">Administration</span>
            </h1>
            <p className="font-['Courier_Prime'] text-xs md:text-sm text-[#4A4536] mt-2 max-w-2xl">
              Configure user roles, subscription tiers, and assign dynamic ward/gali permissions across Balotra constituencies.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-6 py-3 bg-[#1E2A42] text-[#E9E1CC] font-['Courier_Prime'] font-bold text-sm uppercase tracking-wider shadow-[4px_4px_0_rgba(162,56,43,1)] hover:bg-[#A2382B] hover:translate-y-0.5 hover:translate-x-0.5 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>+</span>
            <span>CREATE USER</span>
          </button>
        </header>

        {/* Quick Stats Grid — Responsive: 2 cols mobile, 4 cols desktop */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 font-['Courier_Prime']">
          <div className="bg-[#E1D7BC] border-2 border-[#1E2A42] p-4 shadow-[3px_3px_0_rgba(30,42,66,0.15)]">
            <div className="text-3xl font-black text-[#1E2A42] mt-1 font-['Fraunces']">{totalUsers}</div>
            <div className="text-xs text-[#6B6944] font-bold uppercase tracking-wider">Total Users</div>
          </div>

          <div className="bg-[#E1D7BC] border-2 border-[#1E2A42] p-4 shadow-[3px_3px_0_rgba(30,42,66,0.15)]">
            <div className="text-3xl font-black text-[#1E2A42] mt-1 font-['Fraunces']">{superusersCount}</div>
            <div className="text-xs text-[#6B6944] font-bold uppercase tracking-wider">Superusers</div>
          </div>

          <div className="bg-[#E1D7BC] border-2 border-[#1E2A42] p-4 shadow-[3px_3px_0_rgba(30,42,66,0.15)]">
            <div className="text-3xl font-black text-[#1E2A42] mt-1 font-['Fraunces']">{paidSubscribers}</div>
            <div className="text-xs text-[#6B6944] font-bold uppercase tracking-wider">Paid</div>
          </div>

          <div className={`border-2 p-4 shadow-[3px_3px_0_rgba(30,42,66,0.15)] transition-colors ${
            unassignedPaid > 0 ? "bg-[#FFF3CD] border-[#856404]" : "bg-[#E1D7BC] border-[#1E2A42]"
          }`}>
            <div className="text-3xl font-black text-[#A2382B] mt-1 font-['Fraunces']">{unassignedPaid}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#A2382B]">Needs Assignment</div>
          </div>
        </section>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-[#FDE8E8] border-l-4 border-[#A2382B] text-[#A2382B] font-['Courier_Prime'] text-sm shadow-[2px_2px_0_rgba(162,56,43,0.2)]">
            <strong>ERROR:</strong> {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-[#D4EDDA] border-l-4 border-[#28A745] text-[#155724] font-['Courier_Prime'] text-sm shadow-[2px_2px_0_rgba(40,167,69,0.2)]">
            <strong>SUCCESS:</strong> {success}
          </div>
        )}

        {/* Filter & Live Search Toolbar */}
        <section className="bg-[#D8CCA9] border-2 border-[#1E2A42] p-4 mb-6 shadow-[4px_4px_0_rgba(30,42,66,0.15)] font-['Courier_Prime']">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by volunteer name or email address..."
                className="w-full bg-[#E9E1CC] border border-[#1E2A42] px-4 py-2 text-sm text-[#1E2A42] focus:outline-none focus:ring-1 focus:ring-[#A2382B] placeholder-[#8A8575]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black font-bold"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Tier Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#1E2A42] uppercase">Filter:</span>
              {[
                { id: "all", label: "All Users" },
                { id: "paid", label: "Paid" },
                { id: "free", label: "Free" },
                { id: "unassigned", label: `Unassigned (${unassignedPaid})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterTier(f.id)}
                  className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer ${
                    filterTier === f.id
                      ? "bg-[#1E2A42] text-[#E9E1CC] border-[#1E2A42] shadow-[2px_2px_0_rgba(162,56,43,1)]"
                      : "bg-[#E1D7BC] text-[#1E2A42] border-[#1E2A42]/40 hover:bg-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Actions — only visible when users are selected */}
          {selectedUserIds.size > 0 && (
            <div className="flex items-center justify-between pt-4 border-t-2 border-dashed border-[#1E2A42]/20">
              <span className="text-xs font-bold text-[#A2382B]">
                {selectedUserIds.size} user{selectedUserIds.size > 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserIds(new Set())}
                  className="px-3 py-1 bg-[#E1D7BC] border border-[#1E2A42] text-[#1E2A42] font-bold text-xs uppercase hover:bg-white transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="px-3 py-1 bg-white border border-[#A2382B] text-[#A2382B] font-bold text-xs uppercase hover:bg-[#A2382B] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isBulkDeleting ? "Deleting..." : "Bulk Delete"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* User Directory Table */}
        <section className="bg-[#E1D7BC] border-2 border-[#1E2A42] shadow-[6px_6px_0_rgba(30,42,66,0.2)] overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-[#1E2A42] text-[#E9E1CC] font-['Courier_Prime'] text-xs uppercase tracking-wider border-b-2 border-[#1E2A42]">
                <tr>
                  <th className="py-4 px-6 font-bold text-center w-12">
                    <input
                      type="checkbox"
                      checked={filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.has(u.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)));
                        } else {
                          setSelectedUserIds(new Set());
                        }
                      }}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="py-4 px-6 font-bold">User Identity</th>
                  <th className="py-4 px-6 font-bold text-center">Role</th>
                  <th className="py-4 px-6 font-bold text-center">Tier</th>
                  <th className="py-4 px-6 font-bold">Allowed Wards (Filter 1)</th>
                  <th className="py-4 px-6 font-bold">Allowed Streets (Filter 2)</th>
                  <th className="py-4 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B7A97E] text-sm font-['Lora']">
                {filteredUsers.map((u) => {
                  const isSuper = u.role === "admin" || u.role === "developer";
                  const isPaidUser = !isSuper && (u.subscription_tier === "paid" || u.role === "paid");
                  const hasUnassignedWards = isPaidUser && (!u.allowed_wards || u.allowed_wards.trim() === "");
                  const hasUnassignedGalis = isPaidUser && (!u.allowed_galis || u.allowed_galis.trim() === "");
                  const initials = u.name
                    ? u.name
                        .split(" ")
                        .map((n) => n.charAt(0))
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : u.email.charAt(0).toUpperCase();

                  return (
                    <tr key={u.id} className="hover:bg-[#E9E1CC] transition-colors">
                      {/* Selection Checkbox */}
                      <td className="py-4 px-6 text-center">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(u.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedUserIds);
                            if (e.target.checked) {
                              newSet.add(u.id);
                            } else {
                              newSet.delete(u.id);
                            }
                            setSelectedUserIds(newSet);
                          }}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Identity */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="w-9 h-9 bg-[#1E2A42] text-[#E9E1CC] font-['Courier_Prime'] font-bold flex items-center justify-center text-sm border border-[#1E2A42] hover:bg-[#A2382B] transition-colors cursor-pointer shadow-[2px_2px_0_rgba(162,56,43,1)]"
                            title="Click to edit user details"
                          >
                            {initials}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(u)}
                                className="font-bold text-[#1E2A42] hover:text-[#A2382B] hover:underline text-left cursor-pointer transition-colors"
                                title="Click to edit user details"
                              >
                                {u.name || "Anonymous User"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(u)}
                                className="text-[10px] font-['Courier_Prime'] font-bold px-1.5 py-0.5 bg-[#1E2A42]/10 text-[#1E2A42] border border-[#1E2A42]/30 hover:bg-[#A2382B] hover:text-white hover:border-[#A2382B] transition-all cursor-pointer"
                                title="Edit user permissions & details"
                              >
                                ✎ Edit
                              </button>
                            </div>
                            <div className="text-xs font-['Courier_Prime'] text-[#4A4536] break-all max-w-xs">{u.email}</div>
                            {u.created_at && (
                              <div className="text-[10px] text-[#8A8575] mt-0.5">
                                Joined: {new Date(u.created_at).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6 text-center font-['Courier_Prime']">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-xs font-bold border uppercase ${
                            u.role === "developer"
                              ? "bg-[#1E2A42] text-white border-[#1E2A42]"
                              : u.role === "admin"
                              ? "bg-[#A2382B] text-white border-[#A2382B]"
                              : "bg-white text-[#1E2A42] border-[#1E2A42]/40"
                          }`}
                        >
                          {u.role || "USER"}
                        </span>
                      </td>

                      {/* Tier */}
                      <td className="py-4 px-6 text-center font-['Courier_Prime']">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-xs font-bold border uppercase ${
                            isSuper
                              ? "bg-[#1E2A42]/10 text-[#1E2A42] border-[#1E2A42]"
                              : isPaidUser
                              ? "bg-[#22c55e]/15 text-[#15803d] border-[#15803d]"
                              : "bg-[#4A4536]/10 text-[#4A4536] border-[#4A4536]/40"
                          }`}
                        >
                          {isSuper ? "STAFF (INTERNAL)" : isPaidUser ? "PAID" : "FREE"}
                        </span>
                      </td>

                      {/* Allowed Wards */}
                      <td className="py-4 px-6 font-['Courier_Prime'] text-xs">
                        {hasUnassignedWards ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-[#FFF3CD] border border-[#856404] text-[#856404] font-bold">
                            NULL (Unassigned)
                          </span>
                        ) : u.allowed_wards === "all" || isSuper ? (
                          <span className="px-2 py-0.5 bg-[#1E2A42]/10 border border-[#1E2A42] text-[#1E2A42] font-bold">
                            All Wards
                          </span>
                        ) : u.allowed_wards ? (
                          <span className="font-bold text-[#A2382B] truncate max-w-xs block" title={u.allowed_wards}>
                            {u.allowed_wards}
                          </span>
                        ) : (
                          <span className="text-[#8A8575] italic">None</span>
                        )}
                      </td>

                      {/* Allowed Galis */}
                      <td className="py-4 px-6 font-['Courier_Prime'] text-xs">
                        {hasUnassignedGalis ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-[#FFF3CD] border border-[#856404] text-[#856404] font-bold">
                            NULL (Unassigned)
                          </span>
                        ) : u.allowed_galis === "all" || isSuper ? (
                          <span className="px-2 py-0.5 bg-[#1E2A42]/10 border border-[#1E2A42] text-[#1E2A42] font-bold">
                            All Streets
                          </span>
                        ) : u.allowed_galis ? (
                          <span className="font-bold text-[#1E2A42] truncate max-w-xs block" title={u.allowed_galis}>
                            {u.allowed_galis}
                          </span>
                        ) : (
                          <span className="text-[#8A8575] italic">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right font-['Courier_Prime']">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="px-3 py-1 bg-[#1E2A42] text-[#E9E1CC] font-bold text-xs uppercase shadow-[2px_2px_0_rgba(162,56,43,1)] hover:bg-[#A2382B] transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            className="px-3 py-1 bg-white border border-[#A2382B] text-[#A2382B] font-bold text-xs uppercase hover:bg-[#A2382B] hover:text-white transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#4A4536] font-['Courier_Prime']">
                      No accounts matched your current search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Extracted Side Panel Drawer */}
      <UserDrawer
        isOpen={isDrawerOpen}
        user={selectedUser}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={(msg) => {
          setSuccess(msg);
          fetchUsers();
        }}
        onError={(msg) => setError(msg)}
      />

      <Footer />
    </div>
  );
}
