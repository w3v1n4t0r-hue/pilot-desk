import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};
const envKey = (modern: string, legacy: string) => {
  try { const value = JSON.parse(Deno.env.get(modern) || "null"); if (value?.default) return String(value.default); } catch {}
  return Deno.env.get(legacy) || "";
};
type Subscription = { id: string; status: string; customer: string | { id: string } };
function isSubscription(value: unknown): value is Subscription {
  if (!value || typeof value !== "object") return false;
  const sub = value as Partial<Subscription>;
  return typeof sub.id === "string" && sub.id.startsWith("sub_") && typeof sub.status === "string"
    && (typeof sub.customer === "string" || typeof sub.customer?.id === "string");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors });

  const base = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
  const anon = envKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
  const service = envKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
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

    const adminHeaders: Record<string, string> = service.startsWith("sb_secret_") ? { apikey: service } : { apikey: service, Authorization: `Bearer ${service}` };
    const billing = await fetch(`${base}/rest/v1/billing_subscriptions?select=stripe_customer_id,stripe_subscription_id,status&user_id=eq.${encodeURIComponent(user.id)}&limit=1`, { headers: adminHeaders });
    if (!billing.ok) throw new Error("Unable to verify billing before account deletion.");
    const rows = await billing.json();
    if (!Array.isArray(rows)) throw new Error("Invalid billing response.");
    const record = rows[0];
    if (record) {
      const customer = record.stripe_customer_id, subscriptionId = record.stripe_subscription_id;
      if (customer || subscriptionId) {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
        if (!stripeKey) throw new Error("Billing cancellation is not configured.");
        const stripe = async (path: string, method = "GET") => {
          const response = await fetch(`https://api.stripe.com/v1/${path}`, { method, headers: { Authorization: `Bearer ${stripeKey}` } });
          if (!response.ok) throw new Error("Unable to verify or cancel Stripe subscriptions.");
          return response.json();
        };
        const cancel = async (sub: unknown) => {
          if (!isSubscription(sub) || (customer && (typeof sub.customer === "string" ? sub.customer : sub.customer.id) !== customer)) throw new Error("Invalid subscription response.");
          if (["canceled", "incomplete_expired"].includes(sub.status)) return;
          const canceled = await stripe(`subscriptions/${encodeURIComponent(sub.id)}`, "DELETE");
          if (!isSubscription(canceled) || canceled.id !== sub.id || canceled.status !== "canceled") throw new Error("Subscription cancellation was not confirmed.");
        };
        if (customer) {
          let cursor = "";
          const cursors = new Set<string>();
          do {
            const query = new URLSearchParams({ customer, status: "all", limit: "100" });
            if (cursor) query.set("starting_after", cursor);
            const page = await stripe(`subscriptions?${query}`);
            if (!Array.isArray(page.data) || typeof page.has_more !== "boolean") throw new Error("Invalid subscription list.");
            for (const sub of page.data) await cancel(sub);
            if (!page.has_more) break;
            cursor = page.data.at(-1)?.id;
            if (!cursor || cursors.has(cursor)) throw new Error("Incomplete subscription list.");
            cursors.add(cursor);
          } while (true);
        } else {
          await cancel(await stripe(`subscriptions/${encodeURIComponent(subscriptionId)}`));
        }
      } else if (!["inactive", "canceled", "incomplete_expired"].includes(record.status)) {
        throw new Error("Billing linkage is missing. Resolve billing before deleting this account.");
      }
    }
    const del = await fetch(`${base}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
      method: "DELETE",
      headers: adminHeaders,
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
