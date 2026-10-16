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

    // If a user hits the base path, you can explicitly serve index.html if needed
    if (url.pathname === "/") {
      return env.ASSETS.fetch(new Request(new URL("/index.html", request.url)));
    }

    // Otherwise, Cloudflare natively tries to serve matching files out of your /public folder.
    // If it's a route your static folder doesn't have, it ends up here:
    return new Response("Page not found in public assets", { status: 404 });
  }
};

