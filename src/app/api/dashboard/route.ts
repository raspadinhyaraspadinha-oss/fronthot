import { NextResponse } from "next/server";
import { getMetrics } from "@/lib/analytics";

export async function GET() {
  try {
    const metrics = getMetrics();

    const funnelSteps = [
      { key: "page_views", label: "Page Views", emoji: "👁" },
      { key: "age_gate_passed", label: "Age Gate (+18)", emoji: "✅" },
      { key: "social_proof_seen", label: "Social Proof", emoji: "📱" },
      { key: "overlay_opened", label: "Overlay Aberto", emoji: "📂" },
      { key: "plan_selected", label: "Plano Selecionado", emoji: "🎯" },
      { key: "credit_used", label: "Crédito Usado", emoji: "🎬" },
      { key: "pix_generated", label: "Pix Gerado", emoji: "💳" },
      { key: "payment_completed", label: "Pagamento", emoji: "💰" },
    ];

    const total =
      (metrics.conversion_funnel as Record<string, number>).page_views || 1;

    const funnelHtml = funnelSteps
      .map(({ key, label, emoji }) => {
        const value =
          (metrics.conversion_funnel as Record<string, number>)[key] || 0;
        const pct = ((value / total) * 100).toFixed(1);
        const barWidth = Math.max(((value / total) * 100), 2);
        return `
          <div class="step">
            <div class="step-header">
              <span class="step-emoji">${emoji}</span>
              <span class="step-label">${label}</span>
              <span class="step-value">${value}</span>
              <span class="step-pct">${pct}%</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${barWidth}%"></div>
            </div>
          </div>
        `;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analytics Dashboard</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      background:#0a0a0a;color:#e5e5e5;
      min-height:100vh;padding:16px;
    }
    .wrap{max-width:640px;margin:0 auto}
    h1{font-size:20px;font-weight:700;text-align:center;margin-bottom:20px;color:#fff}
    .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}
    .card{
      background:#18181b;border:1px solid #27272a;border-radius:12px;
      padding:14px 10px;text-align:center;
    }
    .card-val{font-size:28px;font-weight:800;color:#a78bfa}
    .card-label{font-size:11px;color:#71717a;margin-top:2px;text-transform:uppercase;letter-spacing:.04em}
    .section{
      background:#18181b;border:1px solid #27272a;border-radius:12px;
      padding:16px;margin-bottom:16px;
    }
    .section h2{font-size:15px;font-weight:600;margin-bottom:14px;color:#d4d4d8}
    .step{margin-bottom:12px}
    .step:last-child{margin-bottom:0}
    .step-header{display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:13px}
    .step-emoji{font-size:14px;width:20px;text-align:center;flex-shrink:0}
    .step-label{flex:1;color:#a1a1aa}
    .step-value{font-weight:700;color:#e5e5e5;min-width:30px;text-align:right}
    .step-pct{font-size:11px;color:#71717a;min-width:44px;text-align:right}
    .bar-track{height:6px;background:#27272a;border-radius:3px;overflow:hidden}
    .bar-fill{height:100%;background:linear-gradient(90deg,#7c3aed,#ec4899);border-radius:3px;transition:width .4s}
    .footer{text-align:center;margin-top:16px;font-size:11px;color:#52525b}
    .refresh-btn{
      display:block;margin:16px auto 0;
      background:#27272a;border:1px solid #3f3f46;color:#d4d4d8;
      padding:10px 24px;border-radius:10px;font-size:13px;font-weight:600;
      cursor:pointer;transition:background .2s;
    }
    .refresh-btn:active{background:#3f3f46}
    @media(max-width:380px){
      .card-val{font-size:22px}
      .cards{gap:6px}
      .card{padding:10px 6px}
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Analytics</h1>

    <div class="cards">
      <div class="card">
        <div class="card-val">${metrics.total_events}</div>
        <div class="card-label">Total</div>
      </div>
      <div class="card">
        <div class="card-val">${metrics.last_hour}</div>
        <div class="card-label">Última hora</div>
      </div>
      <div class="card">
        <div class="card-val">${metrics.last_24h}</div>
        <div class="card-label">24h</div>
      </div>
    </div>

    <div class="section">
      <h2>Funil de Conversão (24h)</h2>
      ${funnelHtml}
    </div>

    <button class="refresh-btn" onclick="location.reload()">Atualizar</button>
    <p class="footer">Auto-refresh: 30s · Dados in-memory (reseta no deploy)</p>
  </div>

  <script>setTimeout(()=>location.reload(),30000)</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("[DASHBOARD] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
