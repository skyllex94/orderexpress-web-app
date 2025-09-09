import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import AddBusinessModal from "../components/AddBusinessModal";
import InviteUserModal from "../components/InviteUserModal";
import Overview from "./dashboard/Overview";
import Inventory from "./dashboard/Inventory";
import Ordering from "./dashboard/Ordering";
import Analytics from "./dashboard/Analytics";
import SettingsPanel from "./dashboard/Settings";

type SidebarItem = {
  key: string;
  label: string;
};

const items: SidebarItem[] = [
  { key: "overview", label: "Overview" },
  { key: "inventory", label: "Inventory" },
  { key: "ordering", label: "Ordering" },
  { key: "analytics", label: "Analytics" },
];

// Role type is managed within Settings panel now

export default function Dashboard() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("oe_sidebar_collapsed") === "1";
    } catch {
      return false;
    }
  });
  const [active, setActive] = useState("overview");
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [settingsSection, setSettingsSection] = useState<
    "plan" | "users" | "account" | null
  >(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [businessId, setBusinessId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [businessDrawerOpen, setBusinessDrawerOpen] = useState(false);
  const [allBusinesses, setAllBusinesses] = useState<
    { id: string; business_name: string }[]
  >([]);
  const [bizLoading, setBizLoading] = useState(false);
  type Role =
    | "admin"
    | "inventory_manager"
    | "ordering_manager"
    | "sales_manager";
  const [currentRole, setCurrentRole] = useState<Role>("admin");

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;
      // 1) Try businesses the user created/owns
      const { data: ownBiz } = await supabase
        .from("businesses")
        .select("id, business_name")
        .eq("created_by_user", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (ownBiz) {
        if (!mounted) return;
        setBusinessName(ownBiz.business_name || "");
        setBusinessId(ownBiz.id || "");
        setLoading(false);
        return;
      }

      // 2) Otherwise, find a business via user_business_roles (invited users)
      const { data: roleRow } = await supabase
        .from("user_business_roles")
        .select("business_id, role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (roleRow?.business_id) {
        const { data: biz } = await supabase
          .from("businesses")
          .select("id, business_name")
          .eq("id", roleRow.business_id)
          .maybeSingle();
        if (!mounted) return;
        setBusinessName(biz?.business_name || "");
        setBusinessId(biz?.id || "");
        if (roleRow?.role) setCurrentRole(roleRow.role as Role);
        setLoading(false);
        return;
      }

      if (!mounted) return;
      setBusinessName("");
      setBusinessId("");
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Ensure role when businessId known (owner => admin)
  useEffect(() => {
    let mounted = true;
    async function loadRole() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId || !businessId) return;
      const { data: owned } = await supabase
        .from("businesses")
        .select("id")
        .eq("id", businessId)
        .eq("created_by_user", userId)
        .maybeSingle();
      if (owned) {
        if (mounted) setCurrentRole("admin");
        return;
      }
      const { data: roleRow } = await supabase
        .from("user_business_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("business_id", businessId)
        .maybeSingle();
      if (mounted && roleRow?.role) setCurrentRole(roleRow.role as Role);
    }
    loadRole();
    return () => {
      mounted = false;
    };
  }, [businessId]);

  // Load all businesses when drawer opens
  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      if (!businessDrawerOpen) return;
      setBizLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;
        if (!userId) return;

        // Businesses created by the user
        const { data: own } = await supabase
          .from("businesses")
          .select("id, business_name, created_at")
          .eq("created_by_user", userId)
          .order("created_at", { ascending: true });

        // Businesses via roles
        const { data: roles } = await supabase
          .from("user_business_roles")
          .select("business_id")
          .eq("user_id", userId);

        let roleBusinesses: { id: string; business_name: string }[] = [];
        const roleIds = (roles || [])
          .map((r) => r.business_id as string)
          .filter(Boolean);
        if (roleIds.length > 0) {
          const { data: viaRoles } = await supabase
            .from("businesses")
            .select("id, business_name")
            .in("id", roleIds);
          roleBusinesses = (viaRoles || []).map((b) => ({
            id: b.id as string,
            business_name: (b.business_name as string) || "Untitled",
          }));
        }

        const ownedBusinesses = (own || []).map((b) => ({
          id: b.id as string,
          business_name: (b.business_name as string) || "Untitled",
        }));

        // Merge and de-duplicate
        const mergedMap = new Map<
          string,
          { id: string; business_name: string }
        >();
        [...ownedBusinesses, ...roleBusinesses].forEach((b) => {
          mergedMap.set(b.id, b);
        });
        const merged = Array.from(mergedMap.values());

        if (mounted) setAllBusinesses(merged);
      } finally {
        if (mounted) setBizLoading(false);
      }
    }
    loadAll();
    return () => {
      mounted = false;
    };
  }, [businessDrawerOpen]);

  // Enforce allowed menu for role
  useEffect(() => {
    const allowed: Record<Role, string[]> = {
      admin: ["overview", "inventory", "ordering", "analytics"],
      inventory_manager: ["inventory"],
      ordering_manager: ["ordering"],
      sales_manager: ["analytics"],
    };
    if (active === "settings") return;
    const allowedKeys = allowed[currentRole];
    if (!allowedKeys.includes(active)) {
      setActive(allowedKeys[0]);
    }
  }, [currentRole, active]);

  useEffect(() => {
    try {
      localStorage.setItem("oe_sidebar_collapsed", collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  // Settings page content moved to SettingsPanel

  const Icon = ({ k, active: isActive }: { k: string; active: boolean }) => (
    <svg
      className={`h-4 w-4 ${
        isActive ? "text-[var(--oe-green)]" : "text-gray-400"
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {k === "overview" && <path d="M3 12h18M3 6h18M3 18h18" />}
      {k === "inventory" && (
        <>
          <path d="M4 4h16v6H4z" />
          <path d="M4 14h16v6H4z" />
        </>
      )}
      {k === "ordering" && <path d="M6 6h12v12H6z" />}
      {k === "analytics" && (
        <>
          <path d="M4 18V6" />
          <path d="M10 18V10" />
          <path d="M16 18V4" />
        </>
      )}
      {k === "settings" && (
        <>
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.26 1 1.51H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </>
      )}
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 rounded-full border-2 border-white/30 border-t-[var(--oe-green)] animate-spin" />
          <p className="mt-3 text-gray-600">Retrieving data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside
        className={`transition-all duration-300 ${
          collapsed ? "w-16" : "w-52"
        } bg-gradient-to-b from-[#0f1114] to-[#15181c] text-white border-r border-[color:var(--oe-border)] sticky top-0 self-start h-screen`}
      >
        <div className="h-16 flex items-center px-4 border-b border-[color:var(--oe-border)]">
          <div className="h-7 w-7 rounded-md bg-[var(--oe-green)] mr-2" />
          {!collapsed && (
            <span className="text-lg font-semibold">OrderExpress</span>
          )}
        </div>
        <div className="px-4 py-4 border-b border-[color:var(--oe-border)]">
          <button
            onClick={() => setBusinessDrawerOpen(true)}
            className="w-full text-left rounded-md px-2 py-2 hover:bg-white/5"
          >
            {!collapsed ? (
              <>
                <div className="text-xs uppercase tracking-wide text-gray-400">
                  Business
                </div>
                <div className="mt-1 font-medium truncate">
                  {businessName || "Your Business"}
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-400">Biz</div>
            )}
          </button>
        </div>
        <nav className="px-2 py-3 space-y-1">
          {items
            .filter((it) => {
              if (currentRole === "admin") return true;
              if (currentRole === "inventory_manager")
                return it.key === "inventory";
              if (currentRole === "ordering_manager")
                return it.key === "ordering";
              if (currentRole === "sales_manager")
                return it.key === "analytics";
              return true;
            })
            .map((it) => (
              <button
                key={it.key}
                onClick={() => {
                  setActive(it.key);
                  setSettingsOpen(false);
                }}
                className={`w-full text-left flex items-center gap-3 rounded-md px-3 py-2 transition ${
                  active === it.key ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <Icon k={it.key} active={active === it.key} />
                {!collapsed && <span>{it.label}</span>}
              </button>
            ))}

          {/* Settings dropdown */}
          <div>
            <button
              onClick={() => {
                setActive("settings");
                setSettingsOpen(!settingsOpen);
              }}
              className={`w-full text-left flex items-center justify-between rounded-md px-3 py-2 transition ${
                active === "settings" ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon k="settings" active={active === "settings"} />
                {!collapsed && <span>Settings</span>}
              </div>
              {!collapsed && (
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    settingsOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </button>
            {settingsOpen && (
              <div className="mt-1 space-y-1 pl-8">
                <button
                  onClick={() => {
                    setActive("settings");
                    setSettingsSection("plan");
                  }}
                  className={`block w-full text-left rounded-md px-3 py-2 text-sm ${
                    settingsSection === "plan"
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  {!collapsed && "Plan & Billing"}
                </button>
                <button
                  onClick={() => {
                    setActive("settings");
                    setSettingsSection("users");
                  }}
                  className={`block w-full text-left rounded-md px-3 py-2 text-sm ${
                    settingsSection === "users"
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  {!collapsed && "Users"}
                </button>
                <button
                  onClick={() => {
                    setActive("settings");
                    setSettingsSection("account");
                  }}
                  className={`block w-full text-left rounded-md px-3 py-2 text-sm ${
                    settingsSection === "account"
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  {!collapsed && "Account Settings"}
                </button>
              </div>
            )}
          </div>
        </nav>
        {/* Sign out option above arrow */}
        <div className="px-2 pb-2">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/");
            }}
            className="w-full text-left flex items-center gap-3 rounded-md px-3 py-2 hover:bg-white/5 text-white/90"
          >
            <svg
              className="h-4 w-4 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M21 21V3" />
            </svg>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-3 border-t border-[color:var(--oe-border)] flex items-center justify-end gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="ml-auto rounded-md bg-white/5 hover:bg-white/10 p-2"
          >
            <svg
              className={`h-4 w-4 transition-transform ${
                collapsed ? "rotate-180" : ""
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-[120rem]">
          {active === "overview" && (
            <>
              <Overview />
              {!businessName && (
                <div className="mt-4">
                  <button
                    onClick={() => setModalOpen(true)}
                    className="rounded-md bg-[var(--oe-green)] px-3 py-2 text-black text-sm hover:opacity-90"
                  >
                    Add business
                  </button>
                </div>
              )}
            </>
          )}
          {active === "inventory" && <Inventory />}
          {active === "ordering" && <Ordering />}
          {active === "analytics" && <Analytics />}
          {active === "settings" && (
            <SettingsPanel businessId={businessId} section={settingsSection} />
          )}

          <AddBusinessModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onCreated={async () => {
              const { data: sessionData } = await supabase.auth.getSession();
              const userId = sessionData.session?.user.id;
              if (!userId) return;
              // Re-run same selection logic used on load
              const { data: ownBiz } = await supabase
                .from("businesses")
                .select("id, business_name")
                .eq("created_by_user", userId)
                .order("created_at", { ascending: true })
                .limit(1)
                .maybeSingle();
              if (ownBiz) {
                setBusinessName(ownBiz.business_name || "");
                setBusinessId(ownBiz.id || "");
                return;
              }
              const { data: roleRow } = await supabase
                .from("user_business_roles")
                .select("business_id")
                .eq("user_id", userId)
                .limit(1)
                .maybeSingle();
              if (roleRow?.business_id) {
                const { data: biz } = await supabase
                  .from("businesses")
                  .select("id, business_name")
                  .eq("id", roleRow.business_id)
                  .maybeSingle();
                setBusinessName(biz?.business_name || "");
                setBusinessId(biz?.id || "");
              }
            }}
          />
          <InviteUserModal
            isOpen={inviteOpen}
            onClose={() => setInviteOpen(false)}
            onInvite={async ({ email, role }) => {
              if (!businessId) {
                throw new Error("Please create/select a business first.");
              }
              const { data: sessionData } = await supabase.auth.getSession();
              const userId = sessionData.session?.user.id;
              if (!userId) {
                throw new Error("You must be logged in to invite users.");
              }

              const token = (globalThis.crypto?.randomUUID?.() ??
                Math.random().toString(36).slice(2)) as string;

              // 1) Insert pending invitation row
              const { error: insertError } = await supabase
                .from("invitations")
                .insert({
                  business_id: businessId,
                  email,
                  role,
                  token,
                  invited_by: userId,
                  status: "pending",
                });
              if (insertError) throw insertError;

              // 2) Send email via Edge Function (Brevo SMTP)
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

              // Settings panel handles its own refresh; no-op here
            }}
          />
        </div>
      </main>
      {/* Left-side Business Drawer */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          businessDrawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        } bg-black/40`}
        onClick={() => setBusinessDrawerOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#0f1114] to-[#15181c] text-white border-r border-[color:var(--oe-border)] shadow-xl transform transition-transform duration-500 ease-in-out ${
          businessDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!businessDrawerOpen}
      >
        <div className="flex items-center justify-between p-4 border-b border-[color:var(--oe-border)]">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-gray-400">
              Business
            </div>
            <div className="mt-1 font-semibold truncate">
              {businessName || "Your Business"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-md p-2 hover:bg-white/10"
              aria-label="Add business"
            >
              <svg
                className="h-5 w-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </button>
            <button
              onClick={() => setBusinessDrawerOpen(false)}
              className="rounded-md p-2 hover:bg-white/10"
              aria-label="Close"
            >
              <svg
                className="h-5 w-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="text-sm text-gray-300">Businesses</div>
          <div className="mt-3 space-y-2">
            {bizLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-[var(--oe-green)] animate-spin" />
              </div>
            )}
            {!bizLoading && allBusinesses.length === 0 && (
              <div className="text-xs text-gray-400">No businesses found.</div>
            )}
            {!bizLoading &&
              allBusinesses.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-md border border-[color:var(--oe-border)] p-3 ${
                    b.id === businessId ? "bg-white/5" : "hover:bg-white/5"
                  }`}
                >
                  <div className="font-medium truncate">{b.business_name}</div>
                  {b.id === businessId && (
                    <div className="text-xs text-gray-400 mt-1">Current</div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
