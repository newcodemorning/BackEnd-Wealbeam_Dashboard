function getAllowedOrigins() {
  const raw = process.env.CLIENT_URL || process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173';
  return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
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

      callback(new Error(`CORS blocked for origin: ${origin}`));
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
