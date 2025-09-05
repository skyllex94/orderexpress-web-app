import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setIsAuthed(Boolean(data.session));
      setLoading(false);
    }
    check();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session));
    });
    return () => {
      sub.subscription.unsubscribe();
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="oe-content-bg min-h-screen pt-28">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600">Checking authentication…</p>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
