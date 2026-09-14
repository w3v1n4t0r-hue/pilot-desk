import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors });

  const base = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();

  if (!base || !anon || !service) return new Response(JSON.stringify({ error: "Account deletion is not configured." }), { status: 503, headers: cors });
  if (!token) return new Response(JSON.stringify({ error: "Sign in required." }), { status: 401, headers: cors });

  try {
    const userRes = await fetch(`${base}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) return new Response(JSON.stringify({ error: "Session expired. Sign in again." }), { status: 401, headers: cors });

    const user = await userRes.json();
    if (!user?.id) return new Response(JSON.stringify({ error: "Invalid account." }), { status: 401, headers: cors });

    const del = await fetch(`${base}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
      method: "DELETE",
      headers: { apikey: service, Authorization: `Bearer ${service}` },
    });
    if (!del.ok) {
      const text = (await del.text()).slice(0, 400);
      console.error("delete-user-failed", del.status, text);
      return new Response(JSON.stringify({ error: "Unable to delete the account right now." }), { status: 500, headers: cors });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
  } catch (error) {
    console.error("delete-account", error);
    return new Response(JSON.stringify({ error: "Unable to delete the account right now." }), { status: 500, headers: cors });
  }
});
