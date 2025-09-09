import { useEffect, useState } from "react";
import { supabase } from "../../../services/supabase";
import InviteUserModal from "../../../components/InviteUserModal";
import ConfirmModal from "../../../components/ConfirmModal";

type Role =
  | "admin"
  | "inventory_manager"
  | "ordering_manager"
  | "sales_manager";

export default function Users({ businessId }: { businessId: string }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState<
    { name: string; email: string; isCurrentUser: boolean; role: Role }[]
  >([]);
  const [pendingInvites, setPendingInvites] = useState<
    { id: string; email: string; role: Role; invited_at?: string | null }[]
  >([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [inviteToCancel, setInviteToCancel] = useState<string | null>(null);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);

  function formatRoleLabel(role: Role): string {
    const s = role.replace("_", " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      setUsersLoading(true);
      try {
        const { data: userResp, error } = await supabase.auth.getUser();
        if (error) return;
        const current = userResp.user;
        if (!current) return;

        let list: {
          name: string;
          email: string;
          isCurrentUser: boolean;
          role: Role;
        }[] = [];
        if (businessId) {
          const { data: members } = await supabase.rpc("get_business_users", {
            p_business_id: businessId,
          });
          if (Array.isArray(members)) {
            list = members.map(
              (m: {
                user_id: string;
                email: string | null;
                first_name: string | null;
                last_name: string | null;
                role: Role | string;
              }) => {
                const isSelf = m.user_id === current.id;
                const name =
                  [m.first_name, m.last_name]
                    .filter((v): v is string => Boolean(v))
                    .join(" ") ||
                  m.email ||
                  "User";
                return {
                  name,
                  email: m.email || "",
                  isCurrentUser: isSelf,
                  role: (m.role as Role) ?? "inventory_manager",
                };
              }
            );
          }

          const { data: pending } = await supabase
            .from("invitations")
            .select("id, email, role, invited_at, status")
            .eq("business_id", businessId)
            .eq("status", "pending")
            .order("invited_at", { ascending: true });
          if (mounted) {
            setPendingInvites(
              (pending || []).map((p) => ({
                id: p.id as string,
                email: p.email as string,
                role: (p.role as Role) ?? ("inventory_manager" as Role),
                invited_at: (p.invited_at as string) ?? null,
              }))
            );
          }
        }
        if (mounted) setUsers(list);
      } finally {
        if (mounted) setUsersLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [businessId, refreshKey]);

  async function handleInvite(email: string, role: Role) {
    if (!businessId) throw new Error("Please create/select a business first.");
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) throw new Error("You must be logged in to invite users.");
    const token = (globalThis.crypto?.randomUUID?.() ??
      Math.random().toString(36).slice(2)) as string;
    const { error: insertError } = await supabase.from("invitations").insert({
      business_id: businessId,
      email,
      role,
      token,
      invited_by: userId,
      status: "pending",
    });
    if (insertError) throw insertError;
    const acceptUrl = `${window.location.origin}/accept-invite?token=${token}`;
    const subject = "You’re invited to OrderExpress";
    const text = `You’ve been invited to OrderExpress. Open this link to accept: ${acceptUrl}`;
    const html = `<p>You’ve been invited to <strong>OrderExpress</strong>.</p>
      <p>Role: <strong>${role.replace("_", " ")}</strong></p>
      <p><a href="${acceptUrl}">Accept Invitation</a></p>`;
    const { error: fnError } = await supabase.functions.invoke(
      "send-invite-email",
      {
        body: { to: email, subject, text, html },
      }
    );
    if (fnError) throw fnError;
    setRefreshKey((k) => k + 1);
  }

  async function performCancelInvite(id: string) {
    const { error } = await supabase.from("invitations").delete().eq("id", id);
    if (error) {
      console.error("Cancel invitation failed:", error.message);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6">
        <div className="pb-4 flex items-center justify-between">
          <h2 className="font-medium">Users</h2>
          <button
            onClick={() => setInviteOpen(true)}
            className="rounded-md bg-[var(--oe-green)] px-3 py-2 text-black text-sm hover:opacity-90"
          >
            Invite user
          </button>
        </div>
        {/* Desktop/tablet table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs text-gray-500">
              <tr>
                <th className="text-left px-4 py-2 font-medium">User</th>
                <th className="text-left px-4 py-2 font-medium">Email</th>
                <th className="text-left px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {usersLoading && (
                <tr>
                  <td className="px-4 py-8" colSpan={4}>
                    <div className="flex items-center justify-center">
                      <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-[var(--oe-green)] animate-spin" />
                    </div>
                  </td>
                </tr>
              )}
              {!usersLoading && users.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-gray-600" colSpan={8}>
                    No users found.
                  </td>
                </tr>
              )}
              {!usersLoading &&
                users.map((u) => {
                  const currentUserRole = users.find(
                    (x) => x.isCurrentUser
                  )?.role;
                  const canManage = currentUserRole === "admin";
                  const showMenu = canManage && !u.isCurrentUser;
                  return (
                    <tr key={u.email} className="hover:bg-black/5">
                      <td className="px-4 py-3 whitespace-nowrap">{u.name}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {u.email}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatRoleLabel(u.role)}
                      </td>
                      <td className="px-4 py-3 text-right relative">
                        {showMenu && (
                          <div className="inline-block text-left">
                            <button
                              className="rounded p-2 hover:bg-black/10"
                              aria-label="User actions"
                              onClick={() =>
                                setOpenMenuFor((prev) =>
                                  prev === u.email ? null : u.email
                                )
                              }
                            >
                              <svg
                                className="h-5 w-5 text-gray-700"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <circle cx="12" cy="5" r="1.5" />
                                <circle cx="12" cy="12" r="1.5" />
                                <circle cx="12" cy="19" r="1.5" />
                              </svg>
                            </button>
                            {openMenuFor === u.email && (
                              <div className="absolute right-0 mt-2 w-40 rounded-md bg-white shadow-lg ring-1 ring-black/10 z-10">
                                <button
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-black/5"
                                  onClick={() => {
                                    setOpenMenuFor(null);
                                    // TODO: open change role flow
                                  }}
                                >
                                  Change Role
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    setOpenMenuFor(null);
                                    // TODO: open delete confirmation
                                  }}
                                >
                                  Delete User
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="sm:hidden space-y-3">
          {usersLoading && (
            <div className="text-sm text-gray-600">Loading users…</div>
          )}
          {!usersLoading && users.length === 0 && (
            <div className="text-sm text-gray-600">No users found.</div>
          )}
          {!usersLoading &&
            users.map((u) => {
              const currentUserRole = users.find((x) => x.isCurrentUser)?.role;
              const canManage = currentUserRole === "admin";
              const showMenu = canManage && !u.isCurrentUser;
              return (
                <div
                  key={u.email}
                  className="rounded-xl border border-black/10 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-[var(--oe-black)]">
                        {u.name}
                      </div>
                      <div className="text-sm text-gray-700">{u.email}</div>
                    </div>
                    {showMenu && (
                      <div className="relative">
                        <button
                          className="rounded p-2 hover:bg-black/10"
                          aria-label="User actions"
                          onClick={() =>
                            setOpenMenuFor((prev) =>
                              prev === u.email ? null : u.email
                            )
                          }
                        >
                          <svg
                            className="h-5 w-5 text-gray-700"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <circle cx="12" cy="5" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="19" r="1.5" />
                          </svg>
                        </button>
                        {openMenuFor === u.email && (
                          <div className="absolute right-0 mt-2 w-40 rounded-md bg-white shadow-lg ring-1 ring-black/10 z-10">
                            <button
                              className="w-full text-left px-3 py-2 text-xs hover:bg-black/5"
                              onClick={() => {
                                setOpenMenuFor(null);
                                // TODO: open change role flow
                              }}
                            >
                              Change Role
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setOpenMenuFor(null);
                                // TODO: open delete confirmation
                              }}
                            >
                              Delete User
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-800">
                    Role: {formatRoleLabel(u.role)}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6">
        <div className="pb-4 flex items-center justify-between">
          <h3 className="font-medium">Pending</h3>
        </div>
        {pendingInvites.length === 0 ? (
          <p className="text-sm text-gray-600">No pending invitations.</p>
        ) : (
          <>
            {/* Desktop/tablet table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-xs text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Email</th>
                    <th className="text-left px-4 py-2 font-medium">Role</th>
                    <th className="text-right px-4 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvites.map((p) => (
                    <tr key={p.id} className="hover:bg-black/5">
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {p.email}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatRoleLabel(p.role)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="rounded bg-red-500 text-white px-3 py-1 text-xs hover:bg-red-600"
                          onClick={() => {
                            setInviteToCancel(p.id);
                            setConfirmOpen(true);
                          }}
                        >
                          Cancel Invitation
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="sm:hidden space-y-3">
              {pendingInvites.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-black/10 p-4"
                >
                  <div className="text-sm text-gray-700">{p.email}</div>
                  <div className="mt-1 text-sm text-gray-800">
                    Role: {formatRoleLabel(p.role)}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      className="rounded bg-red-500 text-white px-3 py-1 text-xs hover:bg-red-600"
                      onClick={() => {
                        setInviteToCancel(p.id);
                        setConfirmOpen(true);
                      }}
                    >
                      Cancel Invitation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <InviteUserModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={({ email, role }) => handleInvite(email, role as Role)}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        title="Cancel invitation?"
        message="Are you sure you want to cancel this pending invitation? This action cannot be undone."
        confirmLabel="Cancel Invitation"
        cancelLabel="Keep"
        onConfirm={async () => {
          if (inviteToCancel) {
            await performCancelInvite(inviteToCancel);
          }
          setConfirmOpen(false);
          setInviteToCancel(null);
        }}
        onClose={() => {
          setConfirmOpen(false);
          setInviteToCancel(null);
        }}
      />
    </div>
  );
}
