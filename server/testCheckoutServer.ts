import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/test-checkout', (req, res) => {
  const scenario = (req.query.scenario as string) || 'success';

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>QA Sandbox Checkout - Local Test</title>
  <style>
    body {
      background-color: #0b0f19;
      color: #f1f5f9;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .checkout-card {
      background: #151d30;
      border: 1px solid #2a3652;
      border-radius: 12px;
      padding: 32px;
      width: 380px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .badge {
      background: #10b98122;
      border: 1px solid #10b981;
      color: #10b981;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
      letter-spacing: 1px;
    }
    h2 { font-size: 20px; margin-top: 12px; margin-bottom: 24px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
    input {
      width: 100%;
      box-sizing: border-box;
      background: #0b0f19;
      border: 1px solid #334155;
      color: #fff;
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 14px;
    }
    input:focus { border-color: #6366f1; outline: none; }
    .row { display: flex; gap: 12px; }
    .btn-submit {
      width: 100%;
      background: #6366f1;
      color: white;
      font-weight: 600;
      border: none;
      padding: 12px;
      border-radius: 6px;
      font-size: 15px;
      cursor: pointer;
      margin-top: 12px;
    }
    .btn-submit:hover { background: #4f46e5; }
    .status-box {
      margin-top: 20px;
      padding: 12px;
      border-radius: 6px;
      font-weight: 600;
      text-align: center;
      display: none;
    }
    .status-success { background: #064e3b; color: #34d399; border: 1px solid #059669; }
    .status-declined { background: #881337; color: #fda4af; border: 1px solid #e11d48; }
    .status-3ds { background: #78350f; color: #fde68a; border: 1px solid #d97706; }
  </style>
</head>
<body>
  <div class="checkout-card">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span class="badge">QA SANDBOX CHECKOUT</span>
      <span style="font-size:11px; color:#64748b;">Scenario: ${scenario.toUpperCase()}</span>
    </div>
    <h2>Complete Payment Test</h2>

    <form id="payment-form">
      <div class="form-group">
        <label for="card-number">Card Number</label>
        <input type="text" id="card-number" name="cardnumber" autocomplete="cc-number" placeholder="4242 4242 4242 4242" required />
      </div>

      <div class="row">
        <div class="form-group" style="flex:1;">
          <label for="expiry">Expiry (MM/YY)</label>
          <input type="text" id="expiry" name="expiry" autocomplete="cc-exp" placeholder="12/28" required />
        </div>
        <div class="form-group" style="flex:1;">
          <label for="cvc">CVC / CVV</label>
          <input type="text" id="cvc" name="cvc" autocomplete="cc-csc" placeholder="123" required />
        </div>
      </div>

      <div class="form-group">
        <label for="cardholder">Cardholder Name</label>
        <input type="text" id="cardholder" name="cardholder" autocomplete="cc-name" placeholder="John Doe" required />
      </div>

      <div class="row">
        <div class="form-group" style="flex:1;">
          <label for="country">Country</label>
          <input type="text" id="country" name="country" autocomplete="country" value="United States" />
        </div>
        <div class="form-group" style="flex:1;">
          <label for="zip">Zip / Postal Code</label>
          <input type="text" id="zip" name="postal-code" autocomplete="postal-code" placeholder="10001" />
        </div>
      </div>

      <button type="submit" class="btn-submit" id="pay-btn">Pay $10.00 TEST</button>
    </form>

    <div id="status-box" class="status-box"></div>
  </div>

  <script>
    const form = document.getElementById('payment-form');
    const statusBox = document.getElementById('status-box');
    const scenario = "${scenario}";

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      statusBox.style.display = 'block';
      statusBox.textContent = 'Processing sandbox transaction...';

      setTimeout(() => {
        if (scenario === 'success') {
          statusBox.className = 'status-box status-success';
          statusBox.textContent = '✓ Payment Successful! Order Confirmed.';
        } else if (scenario === 'declined') {
          statusBox.className = 'status-box status-declined';
          statusBox.textContent = '× Card Declined: Insufficient Funds (Sandbox Test)';
        } else if (scenario === '3ds') {
          statusBox.className = 'status-box status-3ds';
          statusBox.textContent = '! 3D Secure Authentication Required. Verification OTP sent.';
        } else {
          statusBox.className = 'status-box status-declined';
          statusBox.textContent = '× Payment Error: Unexpected Processor Error';
        }
      }, 1000);
    });
  </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`[QA Test Checkout] Mock server running on http://localhost:${PORT}/test-checkout`);
});
