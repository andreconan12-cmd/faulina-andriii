/**
 * Worker untuk faulina-andriii-web
 * Kombinasi static assets + API server-side logic
 *
 * Routing:
 *  - /api/*  → ditangani oleh Worker (logika server)
 *  - lainnya → disajikan dari static assets (HTML, CSS, JS, gambar)
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // ── CORS headers untuk API ──────────────────────────────
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle preflight CORS
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ── API Routes ──────────────────────────────────────────
    if (pathname.startsWith("/api/")) {
      // GET /api/hello → contoh endpoint
      if (pathname === "/api/hello" && method === "GET") {
        return jsonResponse(
          { message: "Halo dari Cloudflare Workers!", time: new Date().toISOString() },
          corsHeaders
        );
      }

      // GET /api/info → info tentang request
      if (pathname === "/api/info" && method === "GET") {
        return jsonResponse(
          {
            pathname,
            method,
            country: request.cf?.country ?? "unknown",
            colo: request.cf?.colo ?? "unknown",
            ip: request.headers.get("cf-connecting-ip") ?? "unknown",
          },
          corsHeaders
        );
      }

      // POST /api/echo → kembalikan body request
      if (pathname === "/api/echo" && method === "POST") {
        const body = await request.text();
        return jsonResponse({ received: body }, corsHeaders);
      }

      // 404 untuk API route yang tidak dikenal
      return jsonResponse(
        { error: `Endpoint ${method} ${pathname} tidak ditemukan` },
        corsHeaders,
        404
      );
    }

    // ── Static Assets ───────────────────────────────────────
    // Semua request lain disajikan dari static assets
    return env.ASSETS.fetch(request);
  },
};

/**
 * Helper: kembalikan JSON response dengan CORS headers
 */
function jsonResponse(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}
