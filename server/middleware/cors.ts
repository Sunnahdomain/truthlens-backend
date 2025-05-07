import cors from 'cors';

// Create CORS middleware
const corsMiddleware = cors({
  origin: (origin, callback) => {
    // In production, you would check against a list of allowed origins
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Allow specific origins in production
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['https://truthlens.com'];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Replit domains if they exist
    const replitDomains = process.env.REPLIT_DOMAINS 
      ? process.env.REPLIT_DOMAINS.split(',') 
      : [];
    
    if (replitDomains.some(domain => origin.includes(domain))) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
});

export default corsMiddleware;
