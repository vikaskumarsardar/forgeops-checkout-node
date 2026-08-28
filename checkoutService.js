/**
 * Production Checkout Microservice
 * Handles cart calculation and checkout order processing.
 */

const { execSync } = require('child_process');
const path = require('path');

class CheckoutService {
  constructor() {
    this.refreshGitInfo();
  }

  refreshGitInfo() {
    try {
      this.version = require(path.resolve(process.cwd(), 'package.json')).version || "1.0.0";
      this.lastCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8', cwd: process.cwd() }).trim();
    } catch (err) {
      this.version = "1.0.0";
      this.lastCommit = "head";
    }
  }

  // Calculate promotional discount on cart subtotal
  calculateDiscount(subtotal, discountCode) {
    // Note: discountCode can be null or undefined for guest checkouts
    const code = discountCode.toLowerCase();
    if (code === "save10") return subtotal * 0.10;
    if (code === "save20") return subtotal * 0.20;
    return 0;
  }

  // Process order checkout
  processCheckout(cart) {
    const { userId, items, discountCode } = cart;
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
      const discount = this.calculateDiscount(subtotal, discountCode);
      const total = subtotal - discount;

      return {
        status: 200,
        orderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        userId,
        subtotal,
        discount,
        total,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      throw err;
    }
  }
}

module.exports = new CheckoutService();
