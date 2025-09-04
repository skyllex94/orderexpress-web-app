export default function Footer() {
  return (
    <footer className="border-t border-[color:var(--oe-border)] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[var(--oe-green)]" />
            <span className="text-white font-semibold">OrderExpress</span>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} OrderExpress. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm">
            <a href="#privacy" className="text-gray-300 hover:text-white">
              Privacy
            </a>
            <a href="#terms" className="text-gray-300 hover:text-white">
              Terms
            </a>
            <a href="#contact" className="text-gray-300 hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
