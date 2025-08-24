const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
const resend = new Resend('re_DpnxXZAE_FsWRBovwuEUr5uAg7HrJM4TX');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/send-invoice', async (req, res) => {
  try {
    const { 
      to, 
      from, 
      clientName, 
      pdfBase64, 
      invoiceTotal,
      businessName = 'Your Business'
    } = req.body;

    if (!to || !pdfBase64) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert base64 PDF to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    
    const data = await resend.emails.send({
      from: from || 'invoice@resend.dev',
      to: [to],
      subject: `Invoice from ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invoice from ${businessName}</h2>
          <p>Dear ${clientName || 'Valued Customer'},</p>
          
          <p>Please find your invoice attached to this email.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Invoice Summary</h3>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #007bff;">
              Total Amount: ₹${invoiceTotal}
            </p>
          </div>
          
          <p>Thank you for your business!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This invoice was generated using Invoice Generator
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `invoice-${clientName || 'client'}-${Date.now()}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log('Email sent successfully:', data);
    res.json({ success: true, messageId: data.id });
    
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'Email server is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`📧 Email server running on http://localhost:${PORT}`);
});

module.exports = app;