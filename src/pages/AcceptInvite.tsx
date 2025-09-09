import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function AcceptInvite() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordStrengthPercent = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return (score / 5) * 100;
  }, [password]);

  useEffect(() => {
    let mounted = true;
    async function loadInvite() {
      setLoading(true);
      setErrorMessage(null);
      try {
        if (!token) {
          setErrorMessage("Missing invite token.");
          return;
        }
        const { data, error } = await supabase
          .from("invitations")
          .select("email, role, business_id, status, expires_at")
          .eq("token", token)
          .maybeSingle();
        if (error) {
          setErrorMessage(error.message);
          return;
        }
        if (!data) {
          setErrorMessage("Invitation not found.");
          return;
        }
        if (data.status !== "pending") {
          setErrorMessage("This invitation is not valid anymore.");
          return;
        }
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setErrorMessage("This invitation has expired.");
          return;
        }
        if (!mounted) return;
        setEmail(data.email);
        setRole(data.role);
        // businessId not needed on client; server handles association
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadInvite();
    return () => {
      mounted = false;
    };
  }, [token]);

  async function handleAccept(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    if (!password || password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      // 1) Create user as confirmed via Edge Function (Admin API)
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "accept-invite",
        {
          body: {
            token,
            email,
            password,
            first_name: firstName,
            last_name: lastName,
          },
        }
      );
      if (fnError) {
        // Surface server-provided error details when available
        const context =
          (
            fnError as unknown as {
              context?: { error?: string; body?: { error?: string } };
            }
          )?.context || {};
        const serverMsg = context.error || context?.body?.error;
        setErrorMessage(serverMsg || fnError.message);
        return;
      }
      if (fnData && fnData.code === "USER_EXISTS") {
        setErrorMessage(
          "This email already has an account. Please log in with your password, then re-open the invite link."
        );
        return;
      }

      // 2) Sign in and ensure we have a logged in user
      await supabase.auth.signInWithPassword({ email, password });
      const { data: sessionData2 } = await supabase.auth.getSession();
      const userId = sessionData2.session?.user.id;
      const authedEmail = sessionData2.session?.user.email;
      if (!userId) {
        setErrorMessage("Please log in to continue.");
        return;
      }
      if (authedEmail?.toLowerCase() !== email.toLowerCase()) {
        setErrorMessage("Logged in user does not match the invite email.");
        return;
      }

      // Role upsert and invite status update are handled by the server function.

      navigate("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not accept invitation.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 rounded-full border-2 border-black/10 border-t-[var(--oe-green)] animate-spin" />
          <p className="mt-3 text-gray-600">Validating invitation…</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="rounded-2xl bg-white p-6 text-center max-w-lg">
          <h1 className="text-2xl font-semibold text-[var(--oe-black)]">
            Invitation error
          </h1>
          <p className="mt-2 text-gray-700">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="oe-content-bg min-h-[60vh] pt-28">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-6">
          <h1 className="text-2xl font-semibold text-[var(--oe-black)]">
            Accept your invitation
          </h1>
          <p className="mt-2 text-gray-700">
            You have been invited as{" "}
            <strong className="capitalize">{role.replace("_", " ")}</strong>.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleAccept}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                value={email}
                readOnly
                className="mt-1 w-full rounded-md bg-gray-100 px-3 py-2 text-[var(--oe-black)] ring-1 ring-black/10"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] ring-1 ring-black/10 focus:ring-black/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] ring-1 ring-black/10 focus:ring-black/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] ring-1 ring-black/10 focus:ring-black/20"
                placeholder="At least 8 characters"
              />
              <div className="mt-2 h-2 w-full rounded bg-black/10">
                <div
                  className="h-2 rounded bg-[var(--oe-green)]"
                  style={{ width: `${passwordStrengthPercent}%` }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-md bg-white px-3 py-2 text-[var(--oe-black)] ring-1 ring-black/10 focus:ring-black/20"
                placeholder="Re-enter your password"
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
              {isSubmitting ? "Creating account…" : "Accept & create account"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
