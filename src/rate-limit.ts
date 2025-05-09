import rateLimit from 'express-rate-limit';

// Configuration du Rate Limiting
const rateLimiter = rateLimit({
  windowMs: 60 * 1000,  
  max: 100,             // Limiter à 100 requêtes par minute
  message: "Taux limite atteint. Essayez à nouveau plus tard.",
  headers: true,        
});

export default rateLimiter;
