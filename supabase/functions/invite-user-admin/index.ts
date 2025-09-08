import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const raw = await req.text();
    console.log(
      "invite-user-admin: received request body length",
      raw?.length ?? 0
    );
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
      console.error("invite-user-admin: invalid JSON body", raw);
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      });
    }

    const { email, role, business_id } = payload ?? {};
    if (!email || !role || !business_id) {
      console.error("invite-user-admin: missing fields", {
        emailPresent: !!email,
        role,
        business_id,
      });
      return new Response(
        JSON.stringify({ error: "Missing email, role, or business_id" }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 400,
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    console.log("invite-user-admin: sending admin invite", {
      email,
      role,
      business_id,
    });
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        invited_business_id: business_id,
        invited_role: role,
      },
    });
    if (error) {
      console.error("invite-user-admin: invite error", error);
      return new Response(
        JSON.stringify({ error: String(error.message || error) }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 400,
        }
      );
    }

    console.log("invite-user-admin: invite success", {
      userId: data.user?.id ?? null,
    });
    return new Response(
      JSON.stringify({ success: true, user: data.user ?? null }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      }
    );
  } catch (error) {
    console.error("invite-user-admin: unhandled error", error);
    return new Response(
      JSON.stringify({ error: String((error as any)?.message ?? error) }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      }
    );
  }
});
