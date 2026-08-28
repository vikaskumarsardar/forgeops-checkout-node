const assert = require('assert');
const checkoutService = require('../checkoutService');

console.log("🧪 Running CheckoutService Integration Test Suite...");

// Test Case 1: Standard Checkout with valid discount code
try {
  const result1 = checkoutService.processCheckout({
    userId: "user_123",
    items: [{ price: 50, quantity: 2 }],
    discountCode: "SAVE10"
  });
  assert.strictEqual(result1.status, 200);
  assert.strictEqual(result1.discount, 10);
  assert.strictEqual(result1.total, 90);
  console.log("✅ Pass: Valid discount code ('SAVE10')");
} catch (err) {
  console.error("❌ Fail: Valid discount code test failed:", err.message);
  process.exit(1);
}

// Test Case 2: Guest Checkout without discount code (discountCode is null)
try {
  const result2 = checkoutService.processCheckout({
    userId: "guest_456",
    items: [{ price: 40, quantity: 1 }],
    discountCode: null
  });
  assert.strictEqual(result2.status, 200);
  assert.strictEqual(result2.discount, 0);
  assert.strictEqual(result2.total, 40);
  console.log("✅ Pass: Guest checkout (discountCode is null)");
} catch (err) {
  console.error("❌ Fail: Guest checkout test failed:", err.message);
  process.exit(1);
}

// Test Case 3: Guest Checkout with undefined discount code
try {
  const result3 = checkoutService.processCheckout({
    userId: "guest_789",
    items: [{ price: 100, quantity: 1 }]
  });
  assert.strictEqual(result3.status, 200);
  assert.strictEqual(result3.discount, 0);
  assert.strictEqual(result3.total, 100);
  console.log("✅ Pass: Guest checkout (discountCode is undefined)");
} catch (err) {
  console.error("❌ Fail: Undefined discount code test failed:", err.message);
  process.exit(1);
}

console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
