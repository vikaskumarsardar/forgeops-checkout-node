/**
 * Production Checkout Microservice (Target Microservice)
 * Standalone Node.js Microservice Server on Port 4000 with Prometheus /metrics exposition
 */

const express = require('express');
const client = require('prom-client');

// Register Prometheus default metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom Prometheus counter & histogram metrics
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests per service and status',
  labelNames: ['service', 'method', 'status', 'path'],
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['service', 'method', 'status', 'path'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

class CheckoutService {
  constructor() {
    this.version = "1.0.4";
    this.serviceName = "checkout-service";
  }

  applyPromoRules(cart) {
    // Unhandled TypeError when promoRules is undefined
    const activeRule = cart.promoRules.find(r => r.active === true);
    return activeRule ? activeRule.discount : 0;
  }

  processCheckout(cart) {
    const { userId, items, discountCode } = cart;
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const promoExtra = this.applyPromoRules(cart);
    const total = subtotal - promoExtra;

    return {
      status: "SUCCESS",
      orderId: "ORD-" + Math.floor(Math.random() * 90000 + 10000),
      subtotal,
      total,
      currency: "USD",
      timestamp: new Date().toISOString()
    };
  }
}

const checkoutService = new CheckoutService();

// Standalone Express Server on Port 4000
const app = express();
app.use(express.json());

// Prometheus exposition endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Checkout API Endpoint
app.post('/api/v1/checkout', (req, res) => {
  const endTimer = httpRequestDuration.startTimer({ service: 'checkout-service', method: 'POST', path: '/api/v1/checkout' });
  try {
    const result = checkoutService.processCheckout(req.body);
    httpRequestsTotal.inc({ service: 'checkout-service', method: 'POST', status: '200', path: '/api/v1/checkout' });
    endTimer({ status: '200' });
    res.json(result);
  } catch (err) {
    httpRequestsTotal.inc({ service: 'checkout-service', method: 'POST', status: '500', path: '/api/v1/checkout' });
    endTimer({ status: '500' });
    console.error(`[ERROR] [checkout-service] 500 Internal Server Error: ${err.message}\n${err.stack}`);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Standalone server execution if run directly or imported
const PORT = process.env.CHECKOUT_SERVICE_PORT || 4000;
let serverInstance = null;

if (require.main === module || !process.env.CHECKOUT_NO_LISTEN) {
  serverInstance = app.listen(PORT, () => {
    console.log(`🚀 Checkout Microservice Server listening on http://localhost:${PORT} (Metrics on /metrics)`);
  });
}

module.exports = {
  checkoutService,
  app,
  register,
  metrics: { httpRequestsTotal, httpRequestDuration }
};
