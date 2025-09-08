import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function isUuidV4(value: string): boolean {
  // Accept any UUID; relax if your DB enforces v4 specifically
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value || ""
  );
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const raw = await req.text();
    if (!raw) {
      return new Response(JSON.stringify({ error: "Empty body" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      });
    }

    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      });
    }

    const { token, email, password, first_name, last_name } = payload ?? {};
    if (!token || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Missing token, email, or password" }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 400,
        }
      );
    }
    if (!isUuidV4(token)) {
      return new Response(
        JSON.stringify({ error: "Invalid token format (expected UUID)" }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 400,
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // 1) Validate invite
    const { data: invite, error: inviteErr } = await admin
      .from("invitations")
      .select("id, email, role, business_id, status, expires_at")
      .eq("token", token) // safe now that we validated UUID
      .maybeSingle();
    if (inviteErr) {
      return new Response(JSON.stringify({ error: inviteErr.message }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      });
    }
    if (!invite) {
      return new Response(JSON.stringify({ error: "Invitation not found" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 404,
      });
    }
    if (invite.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Invitation is not pending" }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 400,
        }
      );
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Invitation expired" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      });
    }
    if (String(invite.email).toLowerCase() !== String(email).toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Email does not match invitation" }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 400,
        }
      );
    }

    // 2) Create user as confirmed via Admin API
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // mark as confirmed
        user_metadata: { first_name, last_name },
      });

    if (createErr) {
      const msg = String(createErr.message || createErr);
      if (msg.toLowerCase().includes("user already registered")) {
        // Let client handle the “log in instead” branch
        return new Response(JSON.stringify({ code: "USER_EXISTS" }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 200,
        });
      }
      return new Response(JSON.stringify({ error: msg }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      });
    }

    const userId = created.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "User creation failed" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      });
    }

    // 3) Upsert role
    const { error: roleErr } = await admin
      .from("user_business_roles")
      .upsert(
        { user_id: userId, business_id: invite.business_id, role: invite.role },
        { onConflict: "user_id,business_id" }
      );
    if (roleErr) {
      return new Response(JSON.stringify({ error: roleErr.message }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      });
    }

    // 4) Mark invite accepted
    const { error: accErr } = await admin
      .from("invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id);
    if (accErr) {
      return new Response(JSON.stringify({ error: accErr.message }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String((error as any)?.message ?? error) }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      }
    );
  }
});
