import { useEffect, useState } from "react";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
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
    {
      userId: string;
      name: string;
      email: string;
      isCurrentUser: boolean;
      role: Role;
    }[]
  >([]);
  const [pendingInvites, setPendingInvites] = useState<
    { id: string; email: string; role: Role; invited_at?: string | null }[]
  >([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [inviteToCancel, setInviteToCancel] = useState<string | null>(null);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<{
    userId: string;
    email: string;
    name: string;
  } | null>(null);
  // Change role modal state
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState<{
    userId: string;
    email: string;
    name: string;
    role: Role;
  } | null>(null);
  const [roleSelection, setRoleSelection] = useState<Role | null>(null);
  const [changeRoleSaving, setChangeRoleSaving] = useState(false);
  const [changeRoleError, setChangeRoleError] = useState<string | null>(null);

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
          userId: string;
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
                  userId: m.user_id,
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

  async function performDeleteUser(userId: string) {
    const { error } = await supabase.rpc("remove_user_from_business", {
      p_business_id: businessId,
      p_user_id: userId,
    });
    if (error) {
      console.error("Delete user failed:", error.message);
      throw error;
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
            className="inline-flex items-center gap-2 rounded-md border border-[var(--oe-green)] px-3 py-2 text-sm text-[var(--oe-gray)] font-semibold hover:bg-[color:var(--oe-green)]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--oe-green)]"
          >
            <PlusIcon className="h-4 w-4 text-[var(--oe-black)]" />
            <span>Invite user</span>
          </button>
        </div>
        {/* Desktop/tablet table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full text-sm table-fixed">
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
                    <tr key={u.email} className="group">
                      <td className="px-4 py-3 whitespace-nowrap group-hover:bg-black/5 rounded-l-md truncate max-w-[220px]">
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap group-hover:bg-black/5 truncate max-w-[280px]">
                        {u.email}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap group-hover:bg-black/5 truncate max-w-[180px]">
                        {formatRoleLabel(u.role)}
                      </td>
                      <td className="px-4 py-3 text-right align-middle group-hover:bg-black/5 rounded-r-md">
                        <div className="inline-flex items-center justify-end gap-2 h-8">
                          {showMenu ? (
                            <>
                              <button
                                className="rounded p-2 hover:bg-black/10"
                                aria-label="Change role"
                                onClick={() => {
                                  setUserToChangeRole({
                                    userId: u.userId,
                                    email: u.email,
                                    name: u.name,
                                    role: u.role,
                                  });
                                  setRoleSelection(u.role);
                                  setChangeRoleOpen(true);
                                }}
                              >
                                <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-700" />
                              </button>
                              <button
                                className="rounded p-2 hover:bg-red-50"
                                aria-label="Delete user"
                                onClick={() => {
                                  setUserToDelete({
                                    userId: u.userId,
                                    email: u.email,
                                    name: u.name,
                                  });
                                  setDeleteUserOpen(true);
                                }}
                              >
                                <svg
                                  className="h-5 w-5 text-red-600"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <div className="w-8 h-8" />
                          )}
                        </div>
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
                  <div>
                    <div className="font-medium text-[var(--oe-black)]">
                      {u.name}
                    </div>
                    <div className="text-sm text-gray-700 break-words">
                      {u.email}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-800">
                    Role: {formatRoleLabel(u.role)}
                  </div>
                  {showMenu && (
                    <div className="mt-3 flex gap-3">
                      <button
                        className="rounded p-2 hover:bg-black/10"
                        aria-label="Change role"
                        onClick={() => {
                          setUserToChangeRole({
                            userId: u.userId,
                            email: u.email,
                            name: u.name,
                            role: u.role,
                          });
                          setRoleSelection(u.role);
                          setChangeRoleOpen(true);
                        }}
                      >
                        <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-700" />
                      </button>
                      <button
                        className="rounded p-2 hover:bg-red-50"
                        aria-label="Delete user"
                        onClick={() => {
                          setUserToDelete({
                            userId: u.userId,
                            email: u.email,
                            name: u.name,
                          });
                          setDeleteUserOpen(true);
                        }}
                      >
                        <svg
                          className="h-5 w-5 text-red-600"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  )}
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
              <table className="min-w-full text-sm table-fixed">
                <thead className="text-xs text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Email</th>
                    <th className="text-left px-4 py-2 font-medium">Role</th>
                    <th className="text-right px-4 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvites.map((p) => (
                    <tr key={p.id} className="group">
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap group-hover:bg-black/5 rounded-l-md truncate max-w-[320px]">
                        {p.email}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap group-hover:bg-black/5 truncate max-w-[220px]">
                        {formatRoleLabel(p.role)}
                      </td>
                      <td className="px-4 py-3 text-right group-hover:bg-black/5 rounded-r-md">
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

      {/* Change Role Modal - UI only */}
      <ConfirmModal
        isOpen={changeRoleOpen}
        title="Change user role"
        message={
          <div>
            <div className="text-sm text-gray-700">
              <div>
                User:{" "}
                <span className="font-medium text-[var(--oe-black)]">
                  {userToChangeRole?.name}
                </span>
              </div>
              <div className="mt-1">
                Current role:{" "}
                <span className="capitalize">
                  {userToChangeRole?.role?.replace("_", " ")}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Choose a new role for this user. This only affects access within
                this business.
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {(
                [
                  {
                    key: "admin",
                    desc: "Full access across this business, including user management.",
                  },
                  {
                    key: "inventory_manager",
                    desc: "Manage products, stock, and inventory operations.",
                  },
                  {
                    key: "ordering_manager",
                    desc: "Place and manage orders; no inventory editing.",
                  },
                  {
                    key: "sales_manager",
                    desc: "View sales and analytics; read-only for most operations.",
                  },
                ] as { key: Role; desc: string }[]
              ).map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-start gap-3 rounded-md border border-black/10 p-3 hover:bg-black/5 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="role"
                    className="mt-0.5"
                    checked={roleSelection === opt.key}
                    onChange={() => setRoleSelection(opt.key)}
                  />
                  <div>
                    <div className="text-sm font-medium capitalize text-[var(--oe-black)]">
                      {opt.key.replace("_", " ")}
                    </div>
                    <div className="text-xs text-gray-600">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {changeRoleSaving && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                <div className="h-4 w-4 rounded-full border-2 border-black/10 border-t-[var(--oe-green)] animate-spin" />
                <span>Saving…</span>
              </div>
            )}
            {changeRoleError && (
              <div className="mt-3 text-sm text-red-600">{changeRoleError}</div>
            )}
          </div>
        }
        confirmLabel="Save"
        cancelLabel="Cancel"
        onConfirm={async () => {
          if (
            !userToChangeRole ||
            !roleSelection ||
            roleSelection === userToChangeRole.role
          ) {
            setChangeRoleOpen(false);
            setUserToChangeRole(null);
            setRoleSelection(null);
            return;
          }
          setChangeRoleError(null);
          setChangeRoleSaving(true);
          try {
            const { error } = await supabase.rpc("set_user_role_in_business", {
              p_business_id: businessId,
              p_user_id: userToChangeRole.userId,
              p_role: roleSelection,
            });
            if (error) throw error;
            setChangeRoleOpen(false);
            setUserToChangeRole(null);
            setRoleSelection(null);
            setRefreshKey((k) => k + 1);
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : "Could not change role.";
            setChangeRoleError(msg);
          } finally {
            setChangeRoleSaving(false);
          }
        }}
        onClose={() => {
          setChangeRoleOpen(false);
          setUserToChangeRole(null);
          setRoleSelection(null);
        }}
      />

      <ConfirmModal
        isOpen={deleteUserOpen}
        title="Remove user from business?"
        message={
          <div>
            <div>
              Are you sure you want to remove {userToDelete?.name} from this
              business?
            </div>
            {deletingUser && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                <div className="h-4 w-4 rounded-full border-2 border-black/10 border-t-[var(--oe-green)] animate-spin" />
                <span>Removing…</span>
              </div>
            )}
            {deleteError && (
              <div className="mt-3 text-sm text-red-600">{deleteError}</div>
            )}
          </div>
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={async () => {
          if (!userToDelete) return;
          setDeleteError(null);
          setDeletingUser(true);
          try {
            await performDeleteUser(userToDelete.userId);
            setDeleteUserOpen(false);
            setUserToDelete(null);
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : "Could not remove user.";
            setDeleteError(msg);
          } finally {
            setDeletingUser(false);
          }
        }}
        onClose={() => {
          setDeleteUserOpen(false);
          setUserToDelete(null);
          setDeletingUser(false);
          setDeleteError(null);
        }}
      />

      {/* No floating menu; inline icon actions used instead */}
    </div>
  );
}
