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
    console.log("[accept-invite] incoming", {
      method: req.method,
      url: req.url,
      contentType: req.headers.get("content-type"),
      contentLength: req.headers.get("content-length"),
      cfRay: (req as any).headers?.get?.("cf-ray") ?? undefined,
    });
    let payload: any = null;
    try {
      payload = await req.json();
      console.log("[accept-invite] json parsed");
    } catch (jsonErr) {
      console.error("[accept-invite] req.json failed", jsonErr);
      return new Response(
        JSON.stringify({ error: "Empty or invalid JSON body" }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 400,
        }
      );
    }

    const { token, email, password, first_name, last_name } = payload ?? {};
    console.log("[accept-invite] payload parsed", {
      hasToken: Boolean(token),
      tokenPreview:
        typeof token === "string" ? `${token.substring(0, 8)}…` : typeof token,
      email,
      pwLen: typeof password === "string" ? password.length : undefined,
      first_name,
      last_name,
    });
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
      console.error("[accept-invite] invalid token format", token);
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
    console.log("[accept-invite] env", {
      hasUrl: Boolean(supabaseUrl),
      hasServiceKey: Boolean(serviceKey),
      urlPreview: supabaseUrl?.substring?.(0, 32),
    });
    const admin = createClient(supabaseUrl, serviceKey);

    // 1) Validate invite
    const { data: invite, error: inviteErr } = await admin
      .from("invitations")
      .select("id, email, role, business_id, status, expires_at")
      .eq("token", token) // safe now that we validated UUID
      .maybeSingle();
    console.log("[accept-invite] invite lookup", {
      hasInvite: Boolean(invite),
      inviteStatus: invite?.status,
      inviteEmail: invite?.email,
      inviteBusinessId: invite?.business_id,
      inviteErr: inviteErr?.message,
    });
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
      console.error("[accept-invite] email mismatch", {
        inviteEmail: invite.email,
        email,
      });
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
    console.log("[accept-invite] createUser", {
      userId: created?.user?.id,
      createErr: createErr?.message,
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
      console.error("[accept-invite] missing user id after createUser");
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
    console.log("[accept-invite] upsert role", {
      userId,
      businessId: invite.business_id,
      role: invite.role,
      roleErr: roleErr?.message,
    });
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
    console.log("[accept-invite] mark accepted", {
      inviteId: invite.id,
      accErr: accErr?.message,
    });
    if (accErr) {
      return new Response(JSON.stringify({ error: accErr.message }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      });
    }

    console.log("[accept-invite] success", { userId, email });
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (error) {
    console.error("[accept-invite] unhandled", error);
    return new Response(
      JSON.stringify({ error: String((error as any)?.message ?? error) }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      }
    );
  }
});
