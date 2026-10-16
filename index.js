// A fallback simple MIME type dictionary for zero npm dependencies
const getMimeType = (path) => {
  const ext = path.split('.').pop().toLowerCase();
  const types = {
    html: 'text/html; charset=utf-8',
    css: 'text/css',
    js: 'application/javascript',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    json: 'application/json',
    pdf: 'application/pdf',
  };
  return types[ext] || 'application/octet-stream';
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1); // Removes the leading '/' to get the filename

    // 1. Health check or Root route
    if (!key) {
      return new Response('Asset Host Active.', { status: 200 });
    }

    // 2. PUBLIC READ ACCESS (GET requests)
    if (request.method === 'GET') {
      const object = await env.ASSETS_BUCKET.get(key);

      if (!object) {
        return new Response('Asset Not Found', { status: 404 });
      }

      // Check browser cache validation headers
      if (request.headers.get('If-None-Match') === object.httpEtag) {
        return new Response(null, { status: 304 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Content-Type', getMimeType(key));
      // Instruct Cloudflare and browsers to cache the asset heavily
      headers.set('Cache-Control', 'public, max-age=31536000, immutable'); 
      headers.set('Access-Control-Allow-Origin', '*'); // Enable CORS for web fonts/scripts

      return new Response(object.body, { headers });
    }

    // 3. SECURE WRITE ACCESS (PUT/DELETE requests)
    // Expects an 'Authorization: Bearer <your_secret_token>' header
    const authHeader = request.headers.get('Authorization');
    const secretToken = env.UPLOAD_AUTH_TOKEN; // Set this securely in your Cloudflare Dashboard

    if (!secretToken || authHeader !== `Bearer ${secretToken}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (request.method === 'PUT') {
      await env.ASSETS_BUCKET.put(key, request.body);
      return new Response(`Asset ${key} uploaded successfully.`, { status: 200 });
    }

    if (request.method === 'DELETE') {
      await env.ASSETS_BUCKET.delete(key);
      return new Response(`Asset ${key} deleted successfully.`, { status: 200 });
    }

    return new Response('Method Not Allowed', { status: 405 });
  }
};
