const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Resend } = require('resend');
require('dotenv').config({ path: '../.env' });

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.razorpay_key_id,
  key_secret: process.env.razorpay_key_secret
});

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Store for temporary order data (In production, use a database)
const tempOrders = new Map();

// Create order endpoint
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', type, credits } = req.body;

    // Validate input
    if (!amount || amount < 100) { // Minimum 1 rupee (100 paise)
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!type || !['credits', 'subscription'].includes(type)) {
      return res.status(400).json({ error: 'Invalid payment type' });
    }

    // Create order with Razorpay
    const options = {
      amount: parseInt(amount), // Amount in paise
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        type: type,
        credits: credits || 0,
        timestamp: new Date().toISOString()
      }
    };

    const order = await razorpay.orders.create(options);
    
    // Store order details temporarily
    tempOrders.set(order.id, {
      amount: amount,
      currency: currency,
      type: type,
      credits: credits,
      status: 'created',
      createdAt: new Date()
    });

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      message: error.message 
    });
  }
});

// Verify payment endpoint
app.post('/api/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.razorpay_key_secret)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Get order details
    const orderDetails = tempOrders.get(razorpay_order_id);
    if (!orderDetails) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (payment.status !== 'captured') {
      return res.status(400).json({ error: "Payment not successful" });
    }

    // Mark order as verified
    tempOrders.set(razorpay_order_id, {
      ...orderDetails,
      status: 'verified',
      payment_id: razorpay_payment_id,
      verifiedAt: new Date()
    });

    // Return success response with order details
    res.json({
      success: true,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      amount: payment.amount / 100, // Convert paise to rupees
      credits_added: orderDetails.credits,
      type: orderDetails.type
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      error: 'Payment verification failed',
      message: error.message 
    });
  }
});

// Get order status endpoint
app.get('/api/order-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const orderDetails = tempOrders.get(orderId);
    if (!orderDetails) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Also fetch from Razorpay for real-time status
    const order = await razorpay.orders.fetch(orderId);
    
    res.json({
      order_id: orderId,
      status: order.status,
      amount: order.amount / 100,
      currency: order.currency,
      local_status: orderDetails.status,
      credits: orderDetails.credits,
      type: orderDetails.type
    });

  } catch (error) {
    console.error('Order status error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch order status',
      message: error.message 
    });
  }
});

// Webhook endpoint for Razorpay events
app.post('/api/webhook', (req, res) => {
  try {
    const webhookSignature = req.get('X-Razorpay-Signature');
    const body = JSON.stringify(req.body);
    
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.razorpay_webhook_secret || 'webhook_secret')
      .update(body)
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body;
    
    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        console.log('Payment captured:', event.payload.payment.entity.id);
        // Update order status in database
        break;
      
      case 'payment.failed':
        console.log('Payment failed:', event.payload.payment.entity.id);
        // Handle failed payment
        break;
      
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Send invoice email endpoint
app.post('/send-invoice', async (req, res) => {
  try {
    const { to, subject, pdfData, invoiceData } = req.body;
    
    if (!to || !pdfData || !invoiceData) {
      return res.status(400).json({ 
        error: 'Missing required fields: to, pdfData, invoiceData' 
      });
    }

    // Convert base64 PDF data to buffer
    const pdfBuffer = Buffer.from(pdfData.split(',')[1], 'base64');
    
    const emailSubject = subject || `Invoice from ${invoiceData.businessName || 'Invoice Generator'}`;
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Invoice Attached</h2>
        <p>Dear ${invoiceData.clientName || 'Valued Client'},</p>
        
        <p>Please find your invoice attached to this email.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #555;">Invoice Summary:</h3>
          <p><strong>Total Amount:</strong> ₹${invoiceData.total || 'N/A'}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Thank you for your business!</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          This email was sent from Invoice Generator - 
          <a href="http://localhost:3000">Create your own invoices</a>
        </p>
      </div>
    `;

    const data = await resend.emails.send({
      from: 'invoice@resend.dev',
      to: [to],
      subject: emailSubject,
      html: emailContent,
      attachments: [
        {
          filename: `invoice-${Date.now()}.pdf`,
          content: pdfBuffer
        }
      ]
    });

    res.json({
      success: true,
      message: 'Invoice email sent successfully',
      emailId: data.id
    });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    razorpay_configured: !!process.env.razorpay_key_id,
    resend_configured: !!process.env.RESEND_API_KEY
  });
});

// Cleanup old orders (run every hour)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [orderId, order] of tempOrders.entries()) {
    if (order.createdAt < oneHourAgo && order.status === 'created') {
      tempOrders.delete(orderId);
    }
  }
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Payment server running on port ${PORT}`);
  console.log(`Razorpay Key ID: ${process.env.razorpay_key_id ? 'Configured' : 'Not configured'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;