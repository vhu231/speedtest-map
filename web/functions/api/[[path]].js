// Same-origin proxy: the Pages site forwards /api/* to the speedtest-map-api Worker,
// so the browser never needs CORS or to know the Worker's own hostname.
export async function onRequest({ request, env }) {
  if (!env.API) {
    return Response.json({ error: 'API service binding is not configured' }, { status: 503 });
  }
  return env.API.fetch(request);
}
