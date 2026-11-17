// Axion — função "send-digest"
// Corre de hora a hora (pg_cron). Às 18:00 de Lisboa envia a cada pessoa um email com:
//   • Ao computador (com botões para marcar no Teams / Outlook)
//   • O que ficou para trás hoje
//   • Por fazer (sem data)
//   • Amanhã
// O envio usa a API do Brevo; a chave fica no segredo BREVO_API_KEY da função.
// Quem não quiser o resumo desliga-o na app (user_metadata.resumo = false).
// POST {"force":true,"email":"x@y"} envia já, só para esse email (para testar).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const BREVO = Deno.env.get("BREVO_API_KEY") ?? "";
const FROM = { name: "Axion", email: Deno.env.get("AXION_FROM") ?? "nevescamarate@gmail.com" };
const APP = "https://nevescamarate-tech.github.io/axion/";
const TZ = "Europe/Lisbon";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type" };

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("pt-PT", { timeZone: TZ, ...o });
const dia = (t: number) => fmt({ year: "numeric", month: "2-digit", day: "2-digit" }).format(t);
const hora = (t: number) => fmt({ hour: "2-digit", minute: "2-digit" }).format(t);
const hLisboa = (t: number) => Number(fmt({ hour: "2-digit", hourCycle: "h23" }).format(t));
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const toMs = (q: unknown) => (q == null ? null : typeof q === "number" ? q : Date.parse(String(q)));

type It = { id: string; titulo?: string; cat?: string; obra?: string; quando?: number | string | null; feito?: boolean; tipo?: string; local?: string; dur?: number };

function linha(it: It, extra = "") {
  const q = toMs(it.quando);
  const meta = [q ? hora(q) : "", it.obra ? "obra " + it.obra : "", it.local ?? ""].filter(Boolean).join(" · ");
  return `<tr><td style="padding:10px 0;border-bottom:1px solid #e6e9ee">
    <div style="font-size:16px;color:#0f1b2d">${esc(it.titulo)}</div>
    ${meta ? `<div style="font-size:13px;color:#6b7686;margin-top:2px">${esc(meta)}</div>` : ""}${extra}</td></tr>`;
}
function botoesPC(it: It) {
  const s = encodeURIComponent(it.titulo ?? "Reunião");
  const b = (href: string, t: string) =>
    `<a href="${href}" style="display:inline-block;margin:8px 8px 0 0;padding:7px 12px;border-radius:8px;background:#0f1b2d;color:#fff;text-decoration:none;font-size:13px">${t}</a>`;
  return `<div>${b(`https://teams.microsoft.com/l/meeting/new?subject=${s}`, "Marcar no Teams")}${b(`https://outlook.office.com/calendar/deeplink/compose?subject=${s}`, "Marcar no Outlook")}</div>`;
}
function bloco(titulo: string, itens: string[]) {
  if (!itens.length) return "";
  return `<h3 style="margin:24px 0 4px;font-size:15px;color:#e8590c">${titulo} (${itens.length})</h3><table width="100%" cellpadding="0" cellspacing="0">${itens.join("")}</table>`;
}

async function enviar(to: string, nome: string, its: It[], now: number) {
  const hoje = dia(now), amanha = dia(now + 864e5);
  const pend = its.filter((i) => !i.feito);
  const pc = pend.filter((i) => i.cat === "Ao computador");
  const resto = pend.filter((i) => i.cat !== "Ao computador");
  const atras = resto.filter((i) => { const q = toMs(i.quando); return q != null && q < now && dia(q) === hoje; });
  const semData = resto.filter((i) => toMs(i.quando) == null);
  const am = resto.filter((i) => { const q = toMs(i.quando); return q != null && dia(q) === amanha; })
    .sort((a, b) => toMs(a.quando)! - toMs(b.quando)!);
  const total = pc.length + atras.length + semData.length + am.length;
  if (!total) return false;

  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0f1b2d">
  <h2 style="margin:0">Fim do dia${nome ? ", " + esc(nome) : ""}</h2>
  <p style="color:#6b7686;margin:6px 0 0">${pc.length ? `Tens ${pc.length} ${pc.length === 1 ? "coisa" : "coisas"} para tratar ao computador.` : "O resumo do teu dia."}</p>
  ${bloco("Ao computador", pc.map((i) => linha(i, botoesPC(i))))}
  ${bloco("Ficou para trás hoje", atras.map((i) => linha(i)))}
  ${bloco("Por fazer", semData.map((i) => linha(i)))}
  ${bloco("Amanhã", am.map((i) => linha(i)))}
  <p style="margin:28px 0 8px"><a href="${APP}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#e8590c;color:#fff;text-decoration:none;font-weight:bold">Abrir o Axion</a></p>
  <p style="font-size:12px;color:#8a94a3">Recebes este resumo às 18:00. Podes desligá-lo na app, em Conta.</p></div>`;

  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: FROM, to: [{ email: to }],
      subject: pc.length ? `Axion · ${pc.length} para tratar ao computador` : "Axion · resumo do dia",
      htmlContent: html,
    }),
  });
  if (!r.ok) throw new Error("Brevo " + r.status + ": " + (await r.text()));
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const body = await req.json().catch(() => ({}));
  const now = Date.now();
  const force = !!body.force;
  if (!BREVO) return new Response("Falta o segredo BREVO_API_KEY", { status: 500, headers: CORS });
  if (!force && hLisboa(now) !== 18) return new Response(JSON.stringify({ ok: true, skip: "fora das 18h" }), { headers: CORS });

  const { data: ul, error: ue } = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (ue) return new Response(ue.message, { status: 500, headers: CORS });
  let enviados = 0;
  const erros: string[] = [];
  for (const u of ul.users) {
    if (!u.email) continue;
    if (force && body.email && u.email !== body.email) continue;
    if (u.user_metadata?.resumo === false && !force) continue;
    if (!force) {
      const { error: dup } = await sb.from("sent_alerts").insert({ key: `resumo@${u.id}@${dia(now)}` });
      if (dup) continue;
    }
    const { data: rows } = await sb.from("reminders").select("data,feito").eq("user_id", u.id);
    const its = (rows ?? []).map((r) => ({ ...(r.data as It), feito: r.feito }));
    try { if (await enviar(u.email, String(u.user_metadata?.nome ?? ""), its, now)) enviados++; }
    catch (e) { erros.push(String((e as Error).message)); }
  }
  return new Response(JSON.stringify({ ok: !erros.length, enviados, erros }), { headers: { ...CORS, "Content-Type": "application/json" } });
});
