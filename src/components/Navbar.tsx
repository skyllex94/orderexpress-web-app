import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[color:var(--oe-border)] backdrop-blur bg-black/40">
      <nav
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        aria-label="Global"
      >
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md oe-bg-green" />
            <span className="text-white font-semibold text-lg">
              OrderExpress
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-gray-300 hover:text-white transition"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-gray-300 hover:text-white transition"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-gray-300 hover:text-white transition"
            >
              FAQ
            </a>
            <a
              href="#contact"
              className="text-gray-300 hover:text-white transition"
            >
              Contact
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="#login"
              className="px-3 py-2 text-sm text-gray-200 hover:text-white"
            >
              Sign in
            </a>
            <a
              href="#get-started"
              className="px-4 py-2 text-sm font-medium text-black bg-[var(--oe-green)] rounded-md hover:opacity-90 transition"
            >
              Get started
            </a>
          </div>

          <button
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:text-white hover:bg-white/10"
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
          <div className="md:hidden border-t oe-border/50">
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
              <div className="mt-2 flex gap-2">
                <a
                  href="#login"
                  className="flex-1 px-3 py-2 text-center text-gray-200 hover:bg-white/10 rounded"
                >
                  Sign in
                </a>
                <a
                  href="#get-started"
                  className="flex-1 px-3 py-2 text-center text-black bg-[var(--oe-green)] rounded hover:opacity-90"
                >
                  Get started
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
