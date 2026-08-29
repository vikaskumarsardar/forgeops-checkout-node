/**
 * Production Checkout Microservice (Target Microservice)
 * Instrumented with official Prometheus metrics via `prom-client`.
 */
const { execSync } = require('child_process');
const path = require('path');
const client = require('prom-client');

// Initialize Prometheus Default Metrics (CPU, Memory, Handles)
client.collectDefaultMetrics({ prefix: 'checkout_service_' });

// Prometheus Counter for HTTP Requests
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed by checkout service',
  labelNames: ['service', 'status', 'method']
});

// Prometheus Histogram for Request Duration
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['service', 'method'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
});

class CheckoutService {
  constructor() {
    this.version = "1.0.4";
    this.serviceName = "checkout-service";
    this.register = client.register;
  }

  applyPromoRules(cart) {
    // Unhandled TypeError when promoRules is undefined
    const activeRule = cart.promoRules.find(r => r.active === true);
    return activeRule ? activeRule.discount : 0;
  }

  processCheckout(cart) {
    const endTimer = httpRequestDurationSeconds.startTimer({ service: this.serviceName, method: 'POST' });
    try {
      const { userId, items, discountCode } = cart;
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const promoExtra = this.applyPromoRules(cart);
      const total = subtotal - promoExtra;

      httpRequestsTotal.inc({ service: this.serviceName, status: '200', method: 'POST' });
      endTimer();

      return {
        status: "SUCCESS",
        orderId: "ORD-" + Math.floor(Math.random() * 90000 + 10000),
        subtotal,
        total,
        currency: "USD",
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      httpRequestsTotal.inc({ service: this.serviceName, status: '500', method: 'POST' });
      endTimer();
      throw err;
    }
  }

  async getMetricsText() {
    return await client.register.metrics();
  }
}

module.exports = new CheckoutService();
