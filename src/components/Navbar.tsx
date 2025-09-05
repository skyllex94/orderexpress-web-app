import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      const meta = data.user?.user_metadata as
        | { first_name?: string; last_name?: string }
        | undefined;
      if (data.user) {
        const full =
          [meta?.first_name, meta?.last_name].filter(Boolean).join(" ") ||
          data.user.email ||
          null;
        setUserName(full);
      } else {
        setUserName(null);
      }
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata as
          | { first_name?: string; last_name?: string }
          | undefined;
        const full =
          [meta?.first_name, meta?.last_name].filter(Boolean).join(" ") ||
          session.user.email ||
          null;
        setUserName(full);
      } else {
        setUserName(null);
      }
    });
    return () => {
      sub.subscription.unsubscribe();
      mounted = false;
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[var(--oe-ink)]">
      <nav
        className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8"
        aria-label="Global"
      >
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md oe-bg-green" />
            <span className="text-gray-200 font-semibold text-lg">
              OrderExpress
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-gray-200 hover:text-white transition"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-gray-200 hover:text-white transition"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-gray-200 hover:text-white transition"
            >
              FAQ
            </a>
            <a
              href="#contact"
              className="text-gray-200 hover:text-white transition"
            >
              Contact
            </a>
          </div>

          {!userName ? (
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="px-3 py-2 text-sm text-gray-200 hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-medium text-black bg-[var(--oe-green)] rounded-md hover:opacity-90 transition"
              >
                Sign up
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <div className="relative group">
                <button className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:text-white">
                  <div className="h-8 w-8 rounded-full bg-[var(--oe-green)] text-black flex items-center justify-center font-semibold">
                    {userName.slice(0, 1).toUpperCase()}
                  </div>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition absolute right-0 mt-2 w-64 rounded-md bg-[var(--oe-black)]/95 ring-1 ring-[color:var(--oe-border)] p-2 text-sm text-gray-200">
                  <div className="px-3 py-2 border-b border-[color:var(--oe-border)]">
                    <div className="text-xs text-gray-400">Signed in as</div>
                    <div className="font-medium truncate">{userName}</div>
                  </div>
                  <Link
                    to="/dashboard"
                    className="mt-1 block px-3 py-2 rounded hover:bg-white/10"
                  >
                    Dashboard
                  </Link>
                  <div className="px-3 py-2 rounded hover:bg-white/10 cursor-default">
                    Profile (UI only)
                  </div>
                  <div className="px-3 py-2 rounded hover:bg-white/10 cursor-default">
                    Settings (UI only)
                  </div>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setUserName(null);
                      navigate("/");
                    }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-white/10"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-200 hover:text-white hover:bg-white/10"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div className="md:hidden bg-[var(--oe-black)]/90">
            <div className="space-y-1 px-4 py-3">
              <a
                href="#features"
                className="block rounded px-3 py-2 text-gray-200 hover:bg-white/10"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="block rounded px-3 py-2 text-gray-200 hover:bg-white/10"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="block rounded px-3 py-2 text-gray-200 hover:bg-white/10"
              >
                FAQ
              </a>
              <a
                href="#contact"
                className="block rounded px-3 py-2 text-gray-200 hover:bg-white/10"
              >
                Contact
              </a>
              {!userName ? (
                <div className="mt-2 flex gap-2">
                  <Link
                    to="/login"
                    className="flex-1 px-3 py-2 text-center text-gray-200 hover:bg-white/10 rounded"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="flex-1 px-3 py-2 text-center text-black bg-[var(--oe-green)] rounded hover:opacity-90"
                  >
                    Sign up
                  </Link>
                </div>
              ) : (
                <div className="mt-2 space-y-1">
                  <div className="px-3 py-2 text-gray-200">
                    Signed in as <span className="font-medium">{userName}</span>
                  </div>
                  <Link
                    to="/dashboard"
                    className="block rounded px-3 py-2 text-gray-200 hover:bg-white/10"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setUserName(null);
                      navigate("/");
                    }}
                    className="w-full text-left rounded px-3 py-2 text-gray-200 hover:bg-white/10"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
