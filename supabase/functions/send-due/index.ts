// Axion — função "send-due"
// • GET ?pub=1  → devolve a chave pública dos avisos (a app pede-a ao arrancar)
// • POST        → corre a cada minuto e envia os avisos 30 min antes, 10 min antes e na hora
// As chaves dos avisos são geradas aqui na primeira vez e guardadas na tabela app_keys,
// que só o servidor consegue ler.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SUBJECT = "https://nevescamarate-tech.github.io/axion/";
const MIN = 60_000;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type" };
const hm = (t: number) =>
  new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" }).format(t);

let keys: { publicKey: string; privateKey: string } | null = null;
async function vapid() {
  if (keys) return keys;
  const { data } = await sb.from("app_keys").select("name,value").in("name", ["vapid_public", "vapid_private"]);
  const pub = data?.find((r) => r.name === "vapid_public")?.value;
  const priv = data?.find((r) => r.name === "vapid_private")?.value;
  if (pub && priv) keys = { publicKey: pub, privateKey: priv };
  else {
    const k = webpush.generateVAPIDKeys();
    await sb.from("app_keys").upsert([{ name: "vapid_public", value: k.publicKey }, { name: "vapid_private", value: k.privateKey }]);
    keys = k;
  }
  webpush.setVapidDetails(SUBJECT, keys.publicKey, keys.privateKey);
  return keys;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const k = await vapid();
  if (new URL(req.url).searchParams.has("pub")) {
    return new Response(JSON.stringify({ publicKey: k.publicKey }), { headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const now = Date.now();
  // Recados por fazer entre há 1 hora e daqui a 1 dia e 5 minutos (cobre o aviso "1 dia antes").
  const { data: rows, error } = await sb
    .from("reminders")
    .select("id,user_id,data,quando")
    .eq("feito", false)
    .gte("quando", new Date(now - 60 * MIN).toISOString())
    .lte("quando", new Date(now + 1445 * MIN).toISOString());
  if (error) return new Response(error.message, { status: 500, headers: CORS });

  let enviados = 0;
  for (const r of rows ?? []) {
    const q = Date.parse(r.quando);
    const extra = Number(r.data?.antes) || 0;
    const offs = [...new Set([extra, 30, 10, 0])].sort((a, b) => a - b);
    const off = offs.find((o) => now >= q - o * MIN && now < q - o * MIN + (o ? 5 : 60) * MIN);
    if (off === undefined) continue;
    const key = `${r.id}@${q}@${off}`;
    const { error: dup } = await sb.from("sent_alerts").insert({ key });
    if (dup) continue; // já enviado
    for (const o of offs) if (o > off) await sb.from("sent_alerts").insert({ key: `${r.id}@${q}@${o}` });

    const falta = Math.max(1, Math.round((q - now) / MIN));
    const title = off === 0 ? `Agora · ${hm(q)}` : `Daqui a ${falta >= 60 ? Math.round(falta / 60) + " h" : falta + " min"} · ${hm(q)}`;
    const payload = JSON.stringify({ title, body: r.data?.titulo ?? "", id: r.id, off });

    const { data: subs } = await sb.from("push_subs").select("endpoint,sub").eq("user_id", r.user_id);
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(s.sub, payload, { TTL: 600, urgency: "high" });
        enviados++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await sb.from("push_subs").delete().eq("endpoint", s.endpoint);
      }
    }
  }
  return new Response(JSON.stringify({ ok: true, enviados }), { headers: { ...CORS, "Content-Type": "application/json" } });
});
