import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (!["GET", "POST"].includes(req.method)) return json(405, { error: "Method not allowed" });

  const base = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!base || !anon || !service) return json(503, { error: "Owner metrics are not configured." });
  if (!token) return json(401, { error: "Sign in required." });

  try {
    const userRes = await fetch(`${base}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
    if (!userRes.ok) return json(401, { error: "Session expired. Sign in again." });
    const user = await userRes.json();
    if (!user?.id) return json(401, { error: "Invalid account." });

    const adminHeaders = { apikey: service, Authorization: `Bearer ${service}` };
    const isAdmin = async () => {
      const r = await fetch(`${base}/rest/v1/admin_users?select=user_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`, { headers: adminHeaders });
      if (!r.ok) throw new Error(`admin check ${r.status}`);
      const rows = await r.json();
      return Array.isArray(rows) && rows.length > 0;
    };

    let admin = await isAdmin();
    if (!admin && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const claimToken = String(body?.claimToken || "").trim();
      if (!claimToken) return json(403, { error: "Owner access required." });

      const claimRes = await fetch(`${base}/rest/v1/admin_claim_config?select=claim_token,claimed_by&singleton=eq.true&limit=1`, { headers: adminHeaders });
      if (!claimRes.ok) throw new Error(`claim read ${claimRes.status}`);
      const rows = await claimRes.json();
      const claim = Array.isArray(rows) ? rows[0] : null;
      if (!claim || claim.claimed_by || String(claim.claim_token) !== claimToken) return json(403, { error: "Owner key not accepted." });

      const insertRes = await fetch(`${base}/rest/v1/admin_users`, {
        method: "POST",
        headers: { ...adminHeaders, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!insertRes.ok) throw new Error(`admin insert ${insertRes.status}`);

      const patchRes = await fetch(`${base}/rest/v1/admin_claim_config?singleton=eq.true&claimed_by=is.null`, {
        method: "PATCH",
        headers: { ...adminHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ claimed_by: user.id, claimed_at: new Date().toISOString(), claim_token: crypto.randomUUID() }),
      });
      if (!patchRes.ok) throw new Error(`claim update ${patchRes.status}`);
      admin = true;
    }

    if (!admin) return json(403, { error: "Owner access required." });

    const exactCount = (r: Response) => {
      const m = String(r.headers.get("content-range") || "").match(/\/(\d+)$/);
      return m ? Number(m[1]) : 0;
    };
    const countProfiles = async (filter = "") => {
      const r = await fetch(`${base}/rest/v1/profiles?select=id${filter}`, { method: "HEAD", headers: { ...adminHeaders, Prefer: "count=exact" } });
      if (!r.ok) throw new Error(`profile count ${r.status}`);
      return exactCount(r);
    };

    const now = new Date();
    const startToday = new Date(now); startToday.setUTCHours(0,0,0,0);
    const d7 = new Date(now.getTime() - 7 * 86400000);
    const d30 = new Date(now.getTime() - 30 * 86400000);
    const filter = (d: Date) => `&created_at=gte.${encodeURIComponent(d.toISOString())}`;
    const [total, today, last7Days, last30Days] = await Promise.all([
      countProfiles(), countProfiles(filter(startToday)), countProfiles(filter(d7)), countProfiles(filter(d30)),
    ]);

    return json(200, { total, today, last7Days, last30Days, generatedAt: now.toISOString() });
  } catch (error) {
    console.error("owner-metrics", error);
    return json(500, { error: "Unable to load account metrics." });
  }
});
