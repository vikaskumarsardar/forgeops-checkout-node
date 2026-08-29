/**
 * Production Checkout Microservice
 * Handles cart calculation, promo codes, and tax estimation.
 */

const { execSync } = require('child_process');
const path = require('path');

class CheckoutService {
  constructor() {
    this.refreshGitInfo();
  }

  refreshGitInfo() {
    try {
      this.version = require(path.resolve(process.cwd(), 'package.json')).version || "1.0.5";
      this.lastCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8', cwd: process.cwd() }).trim();
    } catch (err) {
      this.version = "1.0.5";
      this.lastCommit = "head";
    }
  }

  calculateDiscount(subtotal, discountCode) {
    if (!discountCode) return 0;
    const code = discountCode.toLowerCase();
    if (code === "save10") return subtotal * 0.10;
    if (code === "save20") return subtotal * 0.20;
    return 0;
  }

  // PRODUCTION BUG: Unhandled taxConfig calculation when taxConfig object or rate is missing!
  calculateTax(subtotal, taxConfig) {
    // Throws TypeError: Cannot read properties of undefined (reading 'rate') when taxConfig is omitted!
    return subtotal * taxConfig.rate;
  }

  processCheckout(cart) {
    const { userId, items, discountCode, taxConfig } = cart;
    if (!items || items.length === 0) {
      throw new Error("Invalid cart: items list cannot be empty");
    }

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = this.calculateDiscount(subtotal, discountCode);
    const tax = this.calculateTax(subtotal, taxConfig);
    const total = subtotal - discount + tax;

    return {
      status: "SUCCESS",
      orderId: `ORD-${Date.now()}`,
      userId: userId || "guest",
      subtotal,
      discount,
      tax,
      total,
      currency: "USD",
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new CheckoutService();
