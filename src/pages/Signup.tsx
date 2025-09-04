import { useMemo, useState } from "react";
import { supabase } from "../services/supabase";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const passwordStrengthPercent = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return (score / 5) * 100;
  }, [password]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!firstName || !lastName) {
      setErrorMessage("Please enter your first and last name.");
      return;
    }
    if (!email) {
      setErrorMessage("Please enter your email.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: { first_name: firstName, last_name: lastName },
        },
      });
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      if (!data.session) {
        setSuccessMessage("Check your email to verify your account.");
      } else {
        setSuccessMessage("Account created successfully.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

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
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First name
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                placeholder="Alex"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last name
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                placeholder="Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
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
                placeholder="At least 8 characters"
              />
              <div className="mt-2 h-2 w-full rounded bg-black/10">
                <div
                  className="h-2 rounded bg-[var(--oe-green)]"
                  style={{ width: `${passwordStrengthPercent}%` }}
                />
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                placeholder="Repeat your password"
              />
            </div>

            {errorMessage && (
              <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="rounded-md bg-[var(--oe-green)]/10 px-3 py-2 text-sm text-[var(--oe-black)]">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-[var(--oe-green)] px-4 py-2 text-black font-medium hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? "Creating account..." : "Sign up"}
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
