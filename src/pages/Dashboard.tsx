import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import ConfirmModal from "../components/ConfirmModal";
import AddBusinessModal from "../components/AddBusinessModal";
import InviteUserModal from "../components/InviteUserModal";
import Overview from "./dashboard/Overview";
import Inventory from "./dashboard/Inventory";
import Ordering from "./dashboard/Ordering";
import Analytics from "./dashboard/Analytics";
import SettingsPanel from "./dashboard/Settings";
import ProductsFood from "./dashboard/products/Food";
import ProductsDrinks from "./dashboard/products/Drinks";
import ProductsCategories from "./dashboard/products/Categories";
import DashboardNavbar from "../components/DashboardNavbar";

type SidebarItem = {
  key: string;
  label: string;
};

const items: SidebarItem[] = [
  { key: "overview", label: "Overview" },
  { key: "products", label: "Products" },
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
  const [switchConfirmOpen, setSwitchConfirmOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [switchCandidate, setSwitchCandidate] = useState<{
    id: string;
    business_name: string;
  } | null>(null);
  type Role =
    | "admin"
    | "inventory_manager"
    | "ordering_manager"
    | "sales_manager";
  const [currentRole, setCurrentRole] = useState<Role>("admin");
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(true);
  const [productsSection, setProductsSection] = useState<
    "food" | "drink" | "categories" | null
  >("food");

  const activeLabel: string =
    active === "settings"
      ? "Settings"
      : active === "products"
      ? "Products"
      : items.find((it) => it.key === active)?.label || "Overview";
  const currentSettingsLabel: string | null =
    settingsSection === "plan"
      ? "Plan & Billing"
      : settingsSection === "users"
      ? "Users"
      : settingsSection === "account"
      ? "Account Settings"
      : null;
  const currentProductsLabel: string | null =
    productsSection === "food"
      ? "Food Products"
      : productsSection === "drink"
      ? "Drink Products"
      : productsSection === "categories"
      ? "Categories"
      : null;

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;
      // Prefer last selected business from localStorage if accessible
      try {
        const storedId = localStorage.getItem("oe_current_business_id");
        if (storedId) {
          const { data: storedBiz } = await supabase
            .from("businesses")
            .select("id, business_name")
            .eq("id", storedId)
            .maybeSingle();
          if (storedBiz) {
            if (!mounted) return;
            setBusinessName(storedBiz.business_name || "");
            setBusinessId(storedBiz.id || "");
            setLoading(false);
            return;
          } else {
            // Clear invalid id
            localStorage.removeItem("oe_current_business_id");
          }
        }
      } catch {
        /* ignore */
      }
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
        try {
          localStorage.setItem("oe_current_business_id", ownBiz.id || "");
        } catch {
          /* ignore */
        }
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
        try {
          if (biz?.id) localStorage.setItem("oe_current_business_id", biz.id);
        } catch {
          /* ignore */
        }
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
      admin: ["overview", "products", "inventory", "ordering", "analytics"],
      inventory_manager: ["products", "inventory"],
      ordering_manager: ["products", "ordering"],
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
      {k === "products" && (
        <>
          <path d="M4 7l8-4 8 4-8 4-8-4z" />
          <path d="M4 7v10l8 4 8-4V7" />
        </>
      )}
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
        className={`hidden md:block transition-all duration-300 ${
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
                return ["products", "inventory"].includes(it.key);
              if (currentRole === "ordering_manager")
                return ["products", "ordering"].includes(it.key);
              if (currentRole === "sales_manager")
                return it.key === "analytics";
              return true;
            })
            .map((it) => (
              <div key={it.key}>
                <button
                  onClick={() => {
                    if (it.key === "products") {
                      setActive("products");
                      setProductsOpen(!productsOpen);
                      return;
                    }
                    setActive(it.key);
                    setSettingsOpen(false);
                  }}
                  className={`w-full text-left flex items-center justify-between rounded-md px-3 py-2 transition ${
                    active === it.key ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon k={it.key} active={active === it.key} />
                    {!collapsed && <span>{it.label}</span>}
                  </div>
                  {!collapsed && it.key === "products" && (
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform ${
                        productsOpen ? "rotate-180" : ""
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
                {it.key === "products" &&
                  (
                    ["admin", "inventory_manager", "ordering_manager"] as Role[]
                  ).includes(currentRole) &&
                  productsOpen && (
                    <div className="mt-1 space-y-1">
                      <button
                        onClick={() => {
                          setActive("products");
                          setProductsSection("food");
                        }}
                        className={`w-full text-left flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                          active === "products" && productsSection === "food"
                            ? "bg-white/10"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <svg
                          className="h-4 w-4 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M6 3v8" />
                          <path d="M10 3v8" />
                          <path d="M6 7h4" />
                          <path d="M14 3v8a2 2 0 0 0 2 2h2V3" />
                        </svg>
                        <span>Food Products</span>
                      </button>
                      <button
                        onClick={() => {
                          setActive("products");
                          setProductsSection("drink");
                        }}
                        className={`w-full text-left flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                          active === "products" && productsSection === "drink"
                            ? "bg-white/10"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <svg
                          className="h-4 w-4 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 3h18" />
                          <path d="M8 3l2 7a4 4 0 0 0 4 3h4" />
                          <path d="M7 21h10" />
                        </svg>
                        <span>Drink Products</span>
                      </button>
                      <button
                        onClick={() => {
                          setActive("products");
                          setProductsSection("categories");
                        }}
                        className={`w-full text-left flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                          active === "products" &&
                          productsSection === "categories"
                            ? "bg-white/10"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <svg
                          className="h-4 w-4 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 4h7v7H4z" />
                          <path d="M13 4h7v7h-7z" />
                          <path d="M4 13h7v7H4z" />
                          <path d="M13 13h7v7h-7z" />
                        </svg>
                        <span>Categories</span>
                      </button>
                    </div>
                  )}
              </div>
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
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => {
                    setActive("settings");
                    setSettingsSection("plan");
                  }}
                  className={`w-full text-left flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                    settingsSection === "plan"
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  {!collapsed && (
                    <>
                      <svg
                        className="h-4 w-4 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                          ry="2"
                        />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>Plan & Billing</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActive("settings");
                    setSettingsSection("users");
                  }}
                  className={`w-full text-left flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                    settingsSection === "users"
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  {!collapsed && (
                    <>
                      <svg
                        className="h-4 w-4 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>Users</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActive("settings");
                    setSettingsSection("account");
                  }}
                  className={`w-full text-left flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                    settingsSection === "account"
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  {!collapsed && (
                    <>
                      <svg
                        className="h-4 w-4 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.26 1 1.51H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      <span>Account Settings</span>
                    </>
                  )}
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

      {/* Mobile slide handle to open nav drawer */}
      {!navDrawerOpen && (
        <button
          onClick={() => setNavDrawerOpen(true)}
          aria-label="Open menu"
          className="md:hidden fixed left-0 top-3 z-40 rounded-r-md bg-[var(--oe-black)]/80 text-white px-2 py-3 shadow"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      <main className="flex-1 px-6 pb-6 pt-0">
        {/* Top sticky navbar showing current menu */}
        <DashboardNavbar
          title={activeLabel}
          subtitle={
            active === "settings"
              ? currentSettingsLabel
              : active === "products"
              ? currentProductsLabel
              : null
          }
          extra={
            active === "products" && productsSection === "drink" ? (
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-48 sm:w-64 md:w-80">
                  <div className="relative">
                    <svg
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.3-4.3" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search drinks…"
                      aria-label="Search drinks"
                      className="w-full rounded-md bg-white/10 border border-[color:var(--oe-border)] pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-[var(--oe-green)]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md bg-[var(--oe-green)] px-3 py-2 text-sm font-medium text-black hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--oe-green)]/60"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  <span>Add Product</span>
                </button>
              </div>
            ) : null
          }
        />
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
          {active === "products" && (
            <>
              {productsSection === "food" && <ProductsFood />}
              {productsSection === "drink" && <ProductsDrinks />}
              {productsSection === "categories" && <ProductsCategories />}
            </>
          )}
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
                try {
                  localStorage.setItem(
                    "oe_current_business_id",
                    ownBiz.id || ""
                  );
                } catch {
                  /* ignore */
                }
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
                try {
                  if (biz?.id)
                    localStorage.setItem("oe_current_business_id", biz.id);
                } catch {
                  /* ignore */
                }
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

      {/* Mobile Nav Drawer */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          navDrawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        } bg-black/40 md:hidden`}
        onClick={() => setNavDrawerOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#0f1114] to-[#15181c] text-white border-r border-[color:var(--oe-border)] shadow-xl transform transition-transform duration-500 ease-in-out ${
          navDrawerOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden`}
        aria-hidden={!navDrawerOpen}
      >
        <div className="flex items-center justify-between p-4 border-b border-[color:var(--oe-border)]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-md bg-[var(--oe-green)]" />
            <div className="font-semibold truncate">OrderExpress</div>
          </div>
          <button
            onClick={() => setNavDrawerOpen(false)}
            className="rounded-md p-2 hover:bg-white/10"
            aria-label="Close menu"
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
        <div className="px-4 py-4 border-b border-[color:var(--oe-border)]">
          <button
            onClick={() => {
              setBusinessDrawerOpen(true);
              setNavDrawerOpen(false);
            }}
            className="w-full text-left rounded-md px-2 py-2 hover:bg-white/5"
          >
            <div className="text-xs uppercase tracking-wide text-gray-400">
              Business
            </div>
            <div className="mt-1 font-medium truncate">
              {businessName || "Your Business"}
            </div>
          </button>
        </div>
        <nav className="px-2 py-3 space-y-1">
          {items
            .filter((it) => {
              if (currentRole === "admin") return true;
              if (currentRole === "inventory_manager")
                return ["products", "inventory"].includes(it.key);
              if (currentRole === "ordering_manager")
                return ["products", "ordering"].includes(it.key);
              if (currentRole === "sales_manager")
                return it.key === "analytics";
              return true;
            })
            .map((it) => (
              <div key={it.key}>
                <button
                  onClick={() => {
                    if (it.key === "products") {
                      setActive("products");
                      setProductsOpen(!productsOpen);
                      return;
                    }
                    setActive(it.key);
                    setSettingsOpen(false);
                    setNavDrawerOpen(false);
                  }}
                  className={`w-full text-left flex items-center justify-between rounded-md px-3 py-2 transition ${
                    active === it.key ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon k={it.key} active={active === it.key} />
                    <span>{it.label}</span>
                  </div>
                  {it.key === "products" && (
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform ${
                        productsOpen ? "rotate-180" : ""
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
                {it.key === "products" &&
                  (
                    ["admin", "inventory_manager", "ordering_manager"] as Role[]
                  ).includes(currentRole) &&
                  productsOpen && (
                    <div className="mt-1 space-y-1">
                      <button
                        onClick={() => {
                          setActive("products");
                          setProductsSection("food");
                          setNavDrawerOpen(false);
                        }}
                        className={`w-full text-left flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                          active === "products" && productsSection === "food"
                            ? "bg-white/10"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <svg
                          className="h-4 w-4 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M6 3v8" />
                          <path d="M10 3v8" />
                          <path d="M6 7h4" />
                          <path d="M14 3v8a2 2 0 0 0 2 2h2V3" />
                        </svg>
                        <span>Food Products</span>
                      </button>
                      <button
                        onClick={() => {
                          setActive("products");
                          setProductsSection("drink");
                          setNavDrawerOpen(false);
                        }}
                        className={`w-full text-left flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                          active === "products" && productsSection === "drink"
                            ? "bg-white/10"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <svg
                          className="h-4 w-4 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 3h18" />
                          <path d="M8 3l2 7a4 4 0 0 0 4 3h4" />
                          <path d="M7 21h10" />
                        </svg>
                        <span>Drink Products</span>
                      </button>
                      <button
                        onClick={() => {
                          setActive("products");
                          setProductsSection("categories");
                          setNavDrawerOpen(false);
                        }}
                        className={`w-full text-left flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                          active === "products" &&
                          productsSection === "categories"
                            ? "bg-white/10"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <svg
                          className="h-4 w-4 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 4h7v7H4z" />
                          <path d="M13 4h7v7h-7z" />
                          <path d="M4 13h7v7H4z" />
                          <path d="M13 13h7v7h-7z" />
                        </svg>
                        <span>Categories</span>
                      </button>
                    </div>
                  )}
              </div>
            ))}

          {/* Settings dropdown (mobile) */}
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
                <span>Settings</span>
              </div>
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
            </button>
            {settingsOpen && (
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => {
                    setActive("settings");
                    setSettingsSection("plan");
                    setNavDrawerOpen(false);
                  }}
                  className={`w-full text-left flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                    settingsSection === "plan"
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  <svg
                    className="h-4 w-4 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Plan & Billing</span>
                </button>
                <button
                  onClick={() => {
                    setActive("settings");
                    setSettingsSection("users");
                    setNavDrawerOpen(false);
                  }}
                  className={`w-full text-left flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                    settingsSection === "users"
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  <svg
                    className="h-4 w-4 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>Users</span>
                </button>
                <button
                  onClick={() => {
                    setActive("settings");
                    setSettingsSection("account");
                    setNavDrawerOpen(false);
                  }}
                  className={`w-full text-left flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                    settingsSection === "account"
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  <svg
                    className="h-4 w-4 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.26 1 1.51H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Account Settings</span>
                </button>
              </div>
            )}
          </div>

          {/* Sign out */}
          <div className="px-2 pb-2 mt-2">
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
              <span>Sign out</span>
            </button>
          </div>
        </nav>
      </div>
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
                <button
                  key={b.id}
                  onClick={() => {
                    if (b.id === businessId) return;
                    setSwitchCandidate(b);
                    setSwitchConfirmOpen(true);
                  }}
                  className={`w-full text-left rounded-md border border-[color:var(--oe-border)] p-3 transition ${
                    b.id === businessId
                      ? "bg-white/5 cursor-default"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="font-medium truncate">{b.business_name}</div>
                  {b.id === businessId && (
                    <div className="text-xs text-gray-400 mt-1">Current</div>
                  )}
                </button>
              ))}
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={switchConfirmOpen}
        title="Switch business?"
        message={
          switching ? (
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full border-2 border-black/10 border-t-[var(--oe-green)] animate-spin" />
              <span>Switching…</span>
            </div>
          ) : (
            <span>
              Switch to <strong>{switchCandidate?.business_name}</strong>?
            </span>
          )
        }
        confirmLabel="Switch"
        cancelLabel="Cancel"
        onConfirm={async () => {
          if (!switchCandidate) return;
          setSwitching(true);
          try {
            // Update current business context
            setBusinessId(switchCandidate.id);
            setBusinessName(switchCandidate.business_name);
            try {
              localStorage.setItem(
                "oe_current_business_id",
                switchCandidate.id
              );
            } catch {
              /* ignore */
            }
            // Optionally close the drawer after switching
            setBusinessDrawerOpen(false);
          } finally {
            setSwitching(false);
            setSwitchConfirmOpen(false);
            setSwitchCandidate(null);
          }
        }}
        onClose={() => {
          if (switching) return; // prevent closing while switching
          setSwitchConfirmOpen(false);
          setSwitchCandidate(null);
        }}
      />
    </div>
  );
}
