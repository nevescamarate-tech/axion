// Axion — função "send-due": corre a cada minuto e envia os avisos
// 30 min antes, 10 min antes e na hora (mais o aviso extra de cada recado).
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:geral@exemplo.pt",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

const MIN = 60_000;
const hm = (t: number) =>
  new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" }).format(t);

Deno.serve(async () => {
  const now = Date.now();
  // Recados por fazer entre há 1 hora e daqui a 1 dia e 5 minutos (cobre o aviso "1 dia antes").
  const { data: rows, error } = await sb
    .from("reminders")
    .select("id,user_id,data,quando")
    .eq("feito", false)
    .gte("quando", new Date(now - 60 * MIN).toISOString())
    .lte("quando", new Date(now + 1445 * MIN).toISOString());
  if (error) return new Response(error.message, { status: 500 });

  let enviados = 0;
  for (const r of rows ?? []) {
    const q = Date.parse(r.quando);
    const extra = Number(r.data?.antes) || 0;
    const offs = [...new Set([extra, 30, 10, 0])].sort((a, b) => a - b);
    // o aviso mais próximo da hora que esteja a decorrer agora
    const off = offs.find((o) => now >= q - o * MIN && now < q - o * MIN + (o ? 5 : 60) * MIN);
    if (off === undefined) continue;
    const key = `${r.id}@${q}@${off}`;
    const { error: dup } = await sb.from("sent_alerts").insert({ key });
    if (dup) continue; // já enviado
    // marcar também os avisos anteriores deste recado, para não chegarem atrasados
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
  return new Response(JSON.stringify({ ok: true, enviados }), { headers: { "Content-Type": "application/json" } });
});
