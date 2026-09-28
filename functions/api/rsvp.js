// ============================================================
// Pages Function: /api/rsvp
// Menangani RSVP & Wishes untuk Faulina & Andri
// KV binding: RSVP_KV
// ============================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

function validateRSVP(data) {
  const errors = [];

  if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
    errors.push("Nama wajib diisi");
  }

  if (
    !data.attendance ||
    !["hadir", "tidak-hadir", "ragu"].includes(data.attendance)
  ) {
    errors.push("Kehadiran tidak valid (harus: hadir, tidak-hadir, atau ragu)");
  }

  if (data.guests !== undefined) {
    const guests = parseInt(data.guests, 10);
    if (isNaN(guests) || guests < 0 || guests > 100) {
      errors.push("Jumlah tamu tidak valid");
    }
  }

  if (data.message && typeof data.message !== "string") {
    errors.push("Pesan harus berupa teks");
  }

  return errors;
}

function sanitize(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .trim();
}

// OPTIONS — CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

// GET /api/rsvp → Load wishes
export async function onRequestGet(context) {
  const { env } = context;
  try {
    const raw = await env.RSVP_KV.get("wishes");
    const wishes = raw ? JSON.parse(raw) : [];
    return jsonResponse({ success: true, data: wishes });
  } catch (err) {
    return jsonResponse(
      { success: false, error: "Gagal memuat data RSVP", detail: err.message },
      500
    );
  }
}

// POST /api/rsvp → Submit RSVP
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();

    const errors = validateRSVP(body);
    if (errors.length > 0) {
      return jsonResponse(
        { success: false, error: "Validasi gagal", details: errors },
        400
      );
    }

    const newWish = {
      id: crypto.randomUUID(),
      name: sanitize(body.name),
      attendance: body.attendance,
      guests: body.guests !== undefined ? parseInt(body.guests, 10) : 0,
      message: body.message ? sanitize(body.message) : "",
      timestamp: new Date().toISOString(),
    };

    const raw = await env.RSVP_KV.get("wishes");
    const wishes = raw ? JSON.parse(raw) : [];

    wishes.unshift(newWish);
    const trimmed = wishes.slice(0, 500);

    await env.RSVP_KV.put("wishes", JSON.stringify(trimmed));

    return jsonResponse({ success: true, data: newWish }, 201);
  } catch (err) {
    return jsonResponse(
      { success: false, error: "Gagal mengirim RSVP", detail: err.message },
      500
    );
  }
}
