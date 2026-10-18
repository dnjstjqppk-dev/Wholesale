export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Organization-ID, Idempotency-Key',
};

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

export function problemResponse(
  status: number,
  code: string,
  title: string,
  detail: string,
  fieldErrors?: any[]
): Response {
  return new Response(
    JSON.stringify({
      type: 'about:blank',
      title,
      status,
      code,
      detail,
      request_id: crypto.randomUUID(),
      field_errors: fieldErrors,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/problem+json',
        ...CORS_HEADERS,
      },
    }
  );
}
