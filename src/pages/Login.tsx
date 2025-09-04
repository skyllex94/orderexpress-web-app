export default function LoginPage() {
  return (
    <main className="oe-content-bg min-h-screen pt-28">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <h1 className="text-3xl font-semibold text-[var(--oe-black)]">
            Log in
          </h1>
          <p className="mt-2 text-gray-600">
            Welcome back. Enter your details to continue.
          </p>
          <form className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                placeholder="••••••••"
              />
            </div>
            <button
              type="button"
              className="w-full rounded-md bg-[var(--oe-green)] px-4 py-2 text-black font-medium hover:opacity-90"
            >
              Log in
            </button>
            <p className="text-center text-sm text-gray-600">
              Don’t have an account?{" "}
              <a href="/signup" className="text-[var(--oe-green)]">
                Sign up
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
