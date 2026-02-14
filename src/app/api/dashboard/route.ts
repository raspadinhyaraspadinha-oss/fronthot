import { NextResponse } from "next/server";
import { getMetrics } from "@/lib/analytics";

export async function GET() {
  try {
    const metrics = getMetrics();

    // Simple HTML dashboard
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StreamVault Analytics</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: white;
      font-size: 2.5rem;
      margin-bottom: 2rem;
      text-align: center;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .card h3 {
      color: #667eea;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }
    .card .value {
      font-size: 3rem;
      font-weight: bold;
      color: #1a202c;
    }
    .funnel {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .funnel h2 {
      color: #667eea;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
    }
    .funnel-step {
      display: flex;
      align-items: center;
      padding: 1rem;
      margin-bottom: 0.5rem;
      border-radius: 8px;
      background: #f7fafc;
      transition: all 0.3s;
    }
    .funnel-step:hover {
      background: #edf2f7;
      transform: translateX(4px);
    }
    .funnel-step .label {
      flex: 1;
      font-weight: 500;
      color: #2d3748;
    }
    .funnel-step .count {
      font-size: 1.5rem;
      font-weight: bold;
      color: #667eea;
      margin-right: 1rem;
    }
    .funnel-step .percentage {
      font-size: 0.875rem;
      color: #718096;
    }
    .refresh {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 9999px;
      font-weight: bold;
      color: #667eea;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s;
    }
    .refresh:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 StreamVault Analytics</h1>

    <div class="grid">
      <div class="card">
        <h3>Total Events</h3>
        <div class="value">${metrics.total_events}</div>
      </div>
      <div class="card">
        <h3>Last Hour</h3>
        <div class="value">${metrics.last_hour}</div>
      </div>
      <div class="card">
        <h3>Last 24h</h3>
        <div class="value">${metrics.last_24h}</div>
      </div>
    </div>

    <div class="funnel">
      <h2>Conversion Funnel (Last 24h)</h2>
      ${Object.entries(metrics.conversion_funnel).map(([key, value], idx, arr) => {
        const total = metrics.conversion_funnel.page_views || 1;
        const percentage = ((value as number / total) * 100).toFixed(1);
        return `
          <div class="funnel-step">
            <div class="label">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
            <div class="count">${value}</div>
            <div class="percentage">${percentage}%</div>
          </div>
        `;
      }).join('')}
    </div>
  </div>

  <button class="refresh" onclick="location.reload()">🔄 Refresh</button>

  <script>
    // Auto-refresh every 30 seconds
    setTimeout(() => location.reload(), 30000);
  </script>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("[DASHBOARD] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
