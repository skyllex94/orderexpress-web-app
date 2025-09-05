import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      if (data.session) {
        navigate("/dashboard");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

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
          <form className="mt-8 space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                placeholder="••••••••"
              />
            </div>
            {errorMessage && (
              <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-[var(--oe-green)] px-4 py-2 text-black font-medium hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Log in"}
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
