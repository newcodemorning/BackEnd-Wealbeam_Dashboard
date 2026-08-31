function getAllowedOrigins() {
  const isProduction =
    process.env.ENVIRONMENT === 'production' ||
    process.env.NODE_ENV === 'production';

  const defaultOrigins = isProduction
    ? 'https://weallbeamtogether.co.uk,https://www.weallbeamtogether.co.uk'
    : 'http://localhost:3000,http://localhost:5173';

  const raw = [
    process.env.CLIENT_URL,
    process.env.CORS_ORIGINS,
    process.env.FRONTEND_URL,
    defaultOrigins
  ]
    .filter(Boolean)
    .join(',');

  const origins = raw.split(',').map((origin) => origin.trim()).filter(Boolean);
  const expanded = new Set(origins);

  for (const origin of origins) {
    try {
      const url = new URL(origin);
      const hostname = url.hostname;

      if (hostname.startsWith('www.')) {
        expanded.add(`${url.protocol}//${hostname.slice(4)}${url.port ? `:${url.port}` : ''}`);
      } else {
        expanded.add(`${url.protocol}//www.${hostname}${url.port ? `:${url.port}` : ''}`);
      }
    } catch (_) {
      // Ignore invalid URL entries
    }
  }

  if (process.env.PROD_BASE_URL?.includes('weallbeamtogether.co.uk')) {
    expanded.add('https://weallbeamtogether.co.uk');
    expanded.add('https://www.weallbeamtogether.co.uk');
  }

  return [...expanded];
}

function buildCorsOptions() {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin(origin, callback) {
      // Allow server-to-server tools and same-origin requests without Origin header
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      console.warn(`[CORS] Blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Requested-With']
  };
}

function buildSocketCorsOptions() {
  return {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST'],
    credentials: true
  };
}

module.exports = {
  getAllowedOrigins,
  buildCorsOptions,
  buildSocketCorsOptions
};
