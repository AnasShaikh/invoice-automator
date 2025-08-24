const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
require('dotenv').config({ path: '../.env' });

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/send-invoice', async (req, res) => {
  try {
    const { 
      to, 
      from, 
      pdfData,
      invoiceData
    } = req.body;

    if (!to || !pdfData || !invoiceData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Extract base64 data from data URL (remove data:application/pdf;base64, prefix)
    const base64Data = pdfData.split(',')[1];
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    
    const { clientName, total, businessName, invoiceNumber, logo } = invoiceData;
    
    const data = await resend.emails.send({
      from: from || 'invoice@resend.dev',
      to: [to],
      subject: `Invoice ${invoiceNumber} from ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${logo ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${logo}" alt="${businessName} Logo" style="max-width: 200px; height: auto;"></div>` : ''}
          <h2>Invoice from ${businessName}</h2>
          <p>Dear ${clientName || 'Valued Customer'},</p>
          
          <p>Please find your invoice attached to this email.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Invoice Summary</h3>
            <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #007bff;">
              <strong>Total Amount:</strong> ${total}
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
          filename: `${invoiceNumber}-${clientName || 'invoice'}.pdf`,
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