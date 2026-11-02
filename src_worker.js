const COOKIE = "mt_admin";
const enc = new TextEncoder();

function json(data, status=200, headers={}) {
  return new Response(JSON.stringify(data), {status, headers: {"content-type":"application/json; charset=utf-8", ...headers}});
}
function b64url(bytes) {
  let s = ""; for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function fromB64url(s) {
  s = s.replace(/-/g,"+").replace(/_/g,"/");
  while (s.length % 4) s += "=";
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), {name:"HMAC", hash:"SHA-256"}, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(value)));
}
async function validSession(request, env) {
  const raw = (request.headers.get("cookie") || "").split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="));
  if (!raw || !env.SESSION_SECRET) return false;
  const token = decodeURIComponent(raw.slice(COOKIE.length+1));
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (await sign(payload, env.SESSION_SECRET) !== sig) return false;
  try { const p = JSON.parse(new TextDecoder().decode(fromB64url(payload))); return p.exp > Date.now() && p.email === env.ADMIN_EMAIL; } catch { return false; }
}
function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
async function api(request, env) {
  const url = new URL(request.url);
  if (request.method === "POST" && url.pathname === "/api/track") {
    let d; try { d = await request.json(); } catch { return json({error:"Invalid JSON"},400); }
    if (!d.visitorId || !d.sessionId || typeof d.visitorId !== "string" || typeof d.sessionId !== "string") return json({error:"Missing session"},400);
    const visitorId=d.visitorId.slice(0,100), sessionId=d.sessionId.slice(0,100), page=String(d.page||"/").slice(0,300);
    await env.DB.prepare("INSERT OR IGNORE INTO visitors(visitor_id) VALUES (?)").bind(visitorId).run();
    await env.DB.prepare("INSERT INTO live_sessions(session_id,visitor_id,page,last_seen) VALUES(?,?,?,unixepoch()) ON CONFLICT(session_id) DO UPDATE SET page=excluded.page,last_seen=unixepoch()").bind(sessionId,visitorId,page).run();
    return json({ok:true});
  }
  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    if (!sameOrigin(request)) return json({error:"Origin rejected"},403);
    let d; try { d=await request.json(); } catch { return json({error:"Invalid request"},400); }
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({error:"Admin secrets are not configured in Worker settings."},503);
    if (String(d.email||"").toLowerCase() !== env.ADMIN_EMAIL.toLowerCase() || String(d.password||"") !== env.ADMIN_PASSWORD) return json({error:"Email or password is incorrect."},401);
    const payload=b64url(enc.encode(JSON.stringify({email:env.ADMIN_EMAIL,exp:Date.now()+8*60*60*1000})));
    const token=payload+"."+await sign(payload,env.SESSION_SECRET);
    return json({ok:true},200, { "set-cookie": `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800` });
  }
  if (url.pathname === "/api/auth/logout" && request.method === "POST") return json({ok:true},200,{"set-cookie":`${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`});
  if (!url.pathname.startsWith("/api/admin/")) return json({error:"Not found"},404);
  if (!(await validSession(request,env))) return json({error:"Unauthorized"},401);
  if (url.pathname === "/api/admin/stats" && request.method === "GET") {
    const [visitors,online,tools,usage,earnings] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) n FROM visitors").first(),
      env.DB.prepare("SELECT COUNT(*) n FROM live_sessions WHERE last_seen >= unixepoch()-120").first(),
      env.DB.prepare("SELECT COUNT(*) n FROM tools").first(),
      env.DB.prepare("SELECT COUNT(*) n FROM tool_usage WHERE used_at >= unixepoch()-86400").first(),
      env.DB.prepare("SELECT source, SUM(amount_paise) total FROM earnings GROUP BY source").all()
    ]);
    const today=await env.DB.prepare("SELECT COALESCE(SUM(amount_paise),0) total FROM earnings WHERE recorded_at >= unixepoch('now','start of day')").first();
    const month=await env.DB.prepare("SELECT COALESCE(SUM(amount_paise),0) total FROM earnings WHERE recorded_at >= unixepoch('now','start of month')").first();
    return json({visitors:visitors.n,online:online.n,tools:tools.n,usesToday:usage.n,todayPaise:today.total,monthPaise:month.total,earnings:earnings.results});
  }
  if (url.pathname === "/api/admin/earnings" && request.method === "POST") {
    if (!sameOrigin(request)) return json({error:"Origin rejected"},403);
    let d; try { d=await request.json(); } catch { return json({error:"Invalid JSON"},400); }
    const source=["adsense","paid_tools","other"].includes(d.source) ? d.source : null;
    const rupees=Number(d.rupees);
    if (!source || !Number.isFinite(rupees) || rupees <= 0 || rupees > 100000000) return json({error:"Enter a valid source and amount."},400);
    await env.DB.prepare("INSERT INTO earnings(source,amount_paise,note) VALUES(?,?,?)").bind(source,Math.round(rupees*100),String(d.note||"Manual entry").slice(0,200)).run();
    return json({ok:true});
  }
  if (url.pathname === "/api/admin/tools" && request.method === "GET") {
    const rows=await env.DB.prepare("SELECT id,slug,title,category,is_paid,price_paise,enabled FROM tools ORDER BY id").all();
    return json({tools:rows.results});
  }
  if (url.pathname === "/api/admin/tools" && request.method === "POST") {
    if (!sameOrigin(request)) return json({error:"Origin rejected"},403);
    let d; try { d=await request.json(); } catch { return json({error:"Invalid JSON"},400); }
    if (!d.slug || !d.title) return json({error:"Tool slug and title are required."},400);
    await env.DB.prepare("INSERT INTO tools(slug,title,category,is_paid,price_paise,enabled) VALUES(?,?,?,?,?,?) ON CONFLICT(slug) DO UPDATE SET title=excluded.title,category=excluded.category,is_paid=excluded.is_paid,price_paise=excluded.price_paise,enabled=excluded.enabled")
      .bind(String(d.slug).slice(0,100),String(d.title).slice(0,120),String(d.category||"").slice(0,80),d.is_paid?1:0,Math.max(0,Math.round(Number(d.priceRupees||0)*100)),d.enabled===false?0:1).run();
    return json({ok:true});
  }
  return json({error:"Not found"},404);
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        return await api(request, env);
      } catch (e) {
        return json({ error: "Server error" }, 500);
      }
    }

    return json({ error: "MahaTools API is running" }, 200);
  }
};
