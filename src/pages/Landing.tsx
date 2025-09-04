export default function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="pt-28 sm:pt-32">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--oe-black)]">
                Vendor Ordering Made Easy
              </h1>
              <p className="mt-4 text-gray-700 text-lg leading-relaxed">
                Run a smooth back of the house ordering, inventory tracking and
                real‑time insights. Reduce manual work, prevent stockouts, and
                keep every order moving.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href="#get-started"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-md text-black bg-[var(--oe-green)] font-medium hover:opacity-90 transition"
                >
                  Get started for Free
                </a>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-md text-[var(--oe-black)] bg-black/5 hover:bg-black/10 transition"
                >
                  View demo
                </a>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                No credit card required.
              </p>
            </div>
            <div className="relative">
              <div className="rounded-xl bg-[var(--oe-card)] p-4">
                <div className="aspect-[16/10] w-full rounded-lg bg-[var(--oe-card)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="mt-16 sm:mt-24">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Trusted by fast-moving teams
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 opacity-70">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-black/5" />
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-12 sm:mt-20">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-[var(--oe-black)]">
                70%
              </div>
              <p className="mt-1 text-gray-600">
                reduction in time spent on inventory
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[var(--oe-black)]">
                50%
              </div>
              <p className="mt-1 text-gray-600">
                less sitting inventory on average
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[var(--oe-black)]">
                1 place
              </div>
              <p className="mt-1 text-gray-600">to manage multiple locations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="mt-12 sm:mt-20">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <h3 className="text-center text-xl font-semibold text-[var(--oe-black)]">
            Integrations
          </h3>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect OrderExpress to your POS and back-office tools.
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded bg-black/5" />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mt-20 sm:mt-28">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-semibold">
              Everything you need to move fast
            </h2>
            <p className="mt-3 text-gray-600">
              Designed for speed, accuracy, and clarity across your order
              lifecycle.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Real-time tracking",
                desc: "Monitor every order from intake to delivery with live updates.",
              },
              {
                title: "Automated workflows",
                desc: "Reduce manual steps with smart routing and status changes.",
              },
              {
                title: "Actionable insights",
                desc: "Understand bottlenecks with dashboards and daily summaries.",
              },
              {
                title: "Inventory & vendor ordering",
                desc: "Count stock fast, auto-generate purchase orders, and track deliveries.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-xl bg-[var(--oe-card)] p-6">
                <div className="h-10 w-10 rounded-md bg-[var(--oe-green)]/20 flex items-center justify-center">
                  <div className="h-4 w-4 rounded bg-[var(--oe-green)]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--oe-black)]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-gray-700">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-20 sm:mt-28">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-10 lg:p-14 text-center">
            <h3 className="text-2xl sm:text-3xl font-semibold text-[var(--oe-black)]">
              Ready to accelerate your orders?
            </h3>
            <p className="mt-3 text-gray-700">
              Start for free and invite your team in minutes.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="#get-started"
                className="px-5 py-3 rounded-md text-black bg-[var(--oe-green)] font-medium hover:opacity-90"
              >
                Get started
              </a>
              <a
                href="#contact"
                className="px-5 py-3 rounded-md text-[var(--oe-black)] bg-black/5 hover:bg-black/10"
              >
                Contact sales
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
