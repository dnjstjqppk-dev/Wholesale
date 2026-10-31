/// <reference lib="dom" />
// apps/api-worker/src/routesRealtime.ts
// Real-Time Server-Sent Events (SSE) Stream & Notification Dispatcher

import { jsonResponse, CORS_HEADERS } from './response';
import { getAuthContext } from './security';
import { notifications, BUYER_ORG_ID } from './store';

export async function handleRealtime(request: Request, url: URL): Promise<Response | null> {
  const ctx = await getAuthContext(request);
  const orgId = ctx?.org?.id || BUYER_ORG_ID;

  // 1. GET /v1/realtime/stream (Server-Sent Events Stream)
  if (url.pathname === '/v1/realtime/stream' && request.method === 'GET') {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connect handshake
        const handshake = `event: connected\ndata: ${JSON.stringify({
          client_id: crypto.randomUUID(),
          connected_at: new Date().toISOString(),
          heartbeat_interval_ms: 15000,
          org_id: orgId,
        })}\n\n`;
        controller.enqueue(encoder.encode(handshake));

        // Send recent active notifications
        const userNotifs = notifications.filter(n => !n.recipient_org_id || n.recipient_org_id === orgId).slice(0, 5);
        for (const notif of userNotifs) {
          const payload = `event: notification\ndata: ${JSON.stringify(notif)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        }

        // Heartbeat ping
        const ping = `event: ping\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`;
        controller.enqueue(encoder.encode(ping));

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        ...CORS_HEADERS,
      },
    });
  }

  // 2. GET /v1/notifications
  if (url.pathname === '/v1/notifications' && request.method === 'GET') {
    const list = notifications.filter(n => !n.recipient_org_id || n.recipient_org_id === orgId);
    return jsonResponse({
      notifications: list,
      unread_count: list.filter(n => !n.is_read).length,
      total_count: list.length,
    });
  }

  // 3. PUT /v1/notifications/:id/read
  const readMatch = url.pathname.match(/^\/v1\/notifications\/([^\/]+)\/read$/);
  if (readMatch && request.method === 'PUT') {
    const notifId = readMatch[1];
    const item = notifications.find(n => n.id === notifId);
    if (item) {
      item.is_read = true;
    }
    return jsonResponse({ success: true, notification_id: notifId });
  }

  // 4. POST /v1/realtime/broadcast
  if (url.pathname === '/v1/realtime/broadcast' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as any;
    const newNotif = {
      id: `notif-${Date.now()}`,
      recipient_org_id: body.recipient_org_id || orgId,
      type: body.type || 'SYSTEM_BROADCAST',
      title: body.title || '시스템 공지',
      message: body.message || '새로운 공지사항이 등록되었습니다.',
      link: body.link || '/orders',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    notifications.unshift(newNotif);

    return jsonResponse({ success: true, notification: newNotif }, 201);
  }

  return null;
}
