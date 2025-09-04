export default function SignupPage() {
  return (
    <main className="oe-content-bg min-h-screen pt-28">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-semibold text-[var(--oe-black)]">
            Create your account
          </h1>
          <p className="mt-2 text-gray-600">
            Start free. No credit card required.
          </p>
          <form className="mt-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                  placeholder="Alex"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                placeholder="you@example.com"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                  placeholder="At least 8 characters"
                />
                <div className="mt-2 h-2 w-full rounded bg-black/10">
                  <div className="h-2 w-1/2 rounded bg-[var(--oe-green)]" />
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  Use 8+ characters with a mix of letters, numbers, and symbols.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Re-enter password
                </label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                  placeholder="Repeat your password"
                />
              </div>
            </div>
            <button
              type="button"
              className="w-full rounded-md bg-[var(--oe-green)] px-4 py-2 text-black font-medium hover:opacity-90"
            >
              Sign up
            </button>
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="text-[var(--oe-green)]">
                Log in
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
