import type React from "react";
import { useMemo, useState } from "react";
// no navigation needed here; we show success screen with link
import { supabase } from "../services/supabase";

export default function SignupPage() {
  const [stage, setStage] = useState<"account" | "business" | "success">(
    "account"
  );
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
      setPendingUserId(data.user?.id ?? null);
      setStage("business");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const [businessName, setBusinessName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [country, setCountry] = useState("United States");
  const [stateProv, setStateProv] = useState("Alabama");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [bizSubmitting, setBizSubmitting] = useState(false);
  const [bizError, setBizError] = useState<string | null>(null);

  async function handleBusinessSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBizError(null);
    if (!businessName || !address1 || !city || !zip) {
      setBizError("Please complete the required fields.");
      return;
    }
    setBizSubmitting(true);
    try {
      const { error } = await supabase.from("businesses").insert({
        business_name: businessName,
        created_by: pendingUserId,
        user_email: email || null,
        business_address:
          address1 +
          " " +
          address2 +
          ", " +
          city +
          ", " +
          stateProv +
          ", " +
          country +
          ", " +
          zip,
      });
      if (error) {
        setBizError(error.message);
        return;
      }
      setStage("success");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not save business.";
      setBizError(message);
    } finally {
      setBizSubmitting(false);
    }
  }

  return (
    <main className="oe-content-bg min-h-screen pt-28">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 text-sm text-gray-600">
            <span
              className={
                stage === "account"
                  ? "font-semibold text-[var(--oe-black)]"
                  : ""
              }
            >
              1. Create account
            </span>
            <span
              className={
                stage === "business"
                  ? "font-semibold text-[var(--oe-black)]"
                  : ""
              }
            >
              2. Add your business
            </span>
            <span
              className={
                stage === "success"
                  ? "font-semibold text-[var(--oe-black)]"
                  : ""
              }
            >
              3. Verify email
            </span>
          </div>
          <div className="relative mt-4 overflow-hidden">
            <div
              className="flex transition-transform duration-500"
              style={{
                transform:
                  stage === "account"
                    ? "translateX(0%)"
                    : stage === "business"
                    ? "translateX(-100%)"
                    : "translateX(-200%)",
              }}
            >
              {/* Stage 1 */}
              <div className="min-w-full pr-0 sm:pr-4 pt-6">
                <h1 className="text-3xl font-semibold text-[var(--oe-black)]">
                  Create your account
                </h1>
                <p className="mt-2 text-gray-600">
                  Start free. No credit card required.
                </p>
                <form className="mt-8 space-y-3 px-2" onSubmit={handleSubmit}>
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
                      Use 8+ characters with a mix of letters, numbers, and
                      symbols.
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
                    {isSubmitting ? "Creating account..." : "Continue"}
                  </button>
                </form>
              </div>
              {/* Stage 2 */}
              <div className="min-w-full pl-0 sm:pl-4 pt-6">
                <h2 className="text-3xl font-semibold text-[var(--oe-black)]">
                  Add your business
                </h2>
                <p className="mt-2 text-gray-600">
                  Choose the type and enter your address.
                </p>
                <form
                  className="mt-8 space-y-4 px-2"
                  onSubmit={handleBusinessSubmit}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Establishment name
                    </label>
                    <input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                      placeholder="Your restaurant"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Address line 1
                    </label>
                    <input
                      value={address1}
                      onChange={(e) => setAddress1(e.target.value)}
                      className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                      placeholder="123 Main St"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Address line 2
                    </label>
                    <input
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                      placeholder="Suite, floor, unit..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm ring-1 ring-black/10 focus:ring-black/20"
                    >
                      <option>United States</option>
                      <option>Canada</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        State/Province
                      </label>
                      <select
                        value={stateProv}
                        onChange={(e) => setStateProv(e.target.value)}
                        className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm ring-1 ring-black/10 focus:ring-black/20"
                      >
                        <option>Alabama</option>
                        <option>California</option>
                        <option>New York</option>
                        <option>Texas</option>
                        <option>Ontario</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          City
                        </label>
                        <input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Zip Code
                        </label>
                        <input
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                          className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] shadow-sm outline-none ring-1 ring-black/10 focus:ring-black/20"
                        />
                      </div>
                    </div>
                  </div>
                  {bizError && (
                    <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700">
                      {bizError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={bizSubmitting}
                    className="w-full rounded-md bg-[var(--oe-green)] px-4 py-2 text-black font-medium hover:opacity-90 disabled:opacity-60"
                  >
                    {bizSubmitting ? "Saving..." : "Continue"}
                  </button>
                </form>
              </div>
              {/* Stage 3: Success */}
              <div className="min-w-full flex items-center justify-center pt-6">
                <div className="max-w-lg text-center px-2">
                  <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-[var(--oe-green)]/20 flex items-center justify-center">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-[var(--oe-green)]"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-[var(--oe-black)]">
                    You're almost there
                  </h3>
                  <p className="mt-2 text-gray-700">
                    We sent a verification link to{" "}
                    <span className="font-medium">{email}</span>. Verify your
                    email to activate your account and continue to your
                    dashboard.
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href="/login"
                      className="px-5 py-3 rounded-md text-black bg-[var(--oe-green)] font-medium hover:opacity-90"
                    >
                      Go to Log in
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
