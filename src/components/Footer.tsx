import { useLocation } from "react-router-dom";

export default function Footer() {
  const location = useLocation();
  if (location.pathname.startsWith("/dashboard")) return null;
  return (
    <footer className="mt-24 bg-[var(--oe-black)] text-white">
      {/* Pre-footer callout */}
      <div className="border-t border-[color:var(--oe-border)] bg-black/60">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <div className="py-5 text-center text-sm text-gray-300">
            Interested in building for the OrderExpress ecosystem?{" "}
            <a
              href="#partners"
              className="text-[var(--oe-green)] hover:opacity-90"
            >
              Learn how →
            </a>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="border-t border-[color:var(--oe-border)]">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10">
            <div>
              <h4 className="text-sm font-semibold text-white">Products</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                <li>
                  <a className="hover:text-white" href="#">
                    Point of Sale
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Online Ordering
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Tables & Reservations
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Kitchen Display
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Inventory
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Loyalty
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                Business Types
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                <li>
                  <a className="hover:text-white" href="#">
                    Quick Service
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Full Service
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Cafés & Bakeries
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Bars
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Food Trucks
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Resources</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                <li>
                  <a className="hover:text-white" href="#">
                    Pricing
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Documentation
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Blog
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Support
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Status
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Contact</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                <li>
                  <a className="hover:text-white" href="tel:+18005551234">
                    Customer Support
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Sales
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Partners
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Company</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                <li>
                  <a className="hover:text-white" href="#">
                    About
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Press
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Security
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Legal
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <hr className="mt-12 border-[color:var(--oe-border)]" />

          {/* Bottom bar */}
          <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-[var(--oe-green)]" />
              <span className="font-semibold">OrderExpress</span>
            </div>
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} OrderExpress, Inc.
            </div>
            <div className="flex items-center gap-5 text-sm">
              <a href="#privacy" className="text-gray-300 hover:text-white">
                Privacy
              </a>
              <a href="#terms" className="text-gray-300 hover:text-white">
                Terms
              </a>
              <div className="flex items-center gap-3">
                <a
                  aria-label="Twitter"
                  href="#"
                  className="text-gray-300 hover:text-white"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 12 7.48v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                  </svg>
                </a>
                <a
                  aria-label="Facebook"
                  href="#"
                  className="text-gray-300 hover:text-white"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22 12a10 10 0 1 0-11.6 9.87v-6.99H7.9V12h2.5V9.8c0-2.46 1.47-3.82 3.72-3.82 1.08 0 2.2.19 2.2.19v2.42h-1.24c-1.22 0-1.6.76-1.6 1.54V12h2.72l-.43 2.88h-2.29v6.99A10 10 0 0 0 22 12" />
                  </svg>
                </a>
                <a
                  aria-label="Instagram"
                  href="#"
                  className="text-gray-300 hover:text-white"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h10zm-5 3a5 5 0 1 0 .001 10.001A5 5 0 0 0 12 7zm0 2a3 3 0 1 1-.001 6.001A3 3 0 0 1 12 9zm5.5-3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
