import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

type SidebarItem = {
  key: string;
  label: string;
};

const items: SidebarItem[] = [
  { key: "overview", label: "Overview" },
  { key: "inventory", label: "Inventory" },
  { key: "ordering", label: "Ordering" },
  { key: "analytics", label: "Analytics" },
  { key: "settings", label: "Settings" },
];

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
  const [businessName, setBusinessName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;
      const { data } = await supabase
        .from("businesses")
        .select("business_name")
        .eq("created_by", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!mounted) return;
      setBusinessName(data?.business_name || "Your Business");
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("oe_sidebar_collapsed", collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

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
          {!collapsed ? (
            <>
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Business
              </div>
              <div className="mt-1 font-medium truncate">{businessName}</div>
            </>
          ) : (
            <div className="text-xs text-gray-400">Biz</div>
          )}
        </div>
        <nav className="px-2 py-3 space-y-1">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => setActive(it.key)}
              className={`w-full text-left flex items-center gap-3 rounded-md px-3 py-2 transition ${
                active === it.key ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <Icon k={it.key} active={active === it.key} />
              {!collapsed && <span>{it.label}</span>}
            </button>
          ))}
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
        <div className="mx-auto max-w-[90rem]">
          <h1 className="text-2xl font-semibold text-[var(--oe-black)]">
            {items.find((i) => i.key === active)?.label}
          </h1>
          <p className="mt-2 text-gray-600">This is the {active} section.</p>
        </div>
      </main>
    </div>
  );
}
