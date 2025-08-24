import React, { useState } from 'react';
import jsPDF from 'jspdf';

const SimpleInvoiceForm = () => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [items, setItems] = useState([
    { product: '', quantity: 1, price: 0 }
  ]);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const addItem = () => {
    setItems([...items, { product: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    const updatedItems = items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateGST = () => {
    return calculateSubtotal() * 0.18;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateGST();
  };

  const generatePDF = () => {
    if (!clientName.trim()) {
      alert('Please enter client name');
      return;
    }

    if (items.some(item => !item.product.trim())) {
      alert('Please fill in all product names');
      return;
    }

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.text('INVOICE', 20, 30);
    
    // Invoice details
    doc.setFontSize(12);
    doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 20, 50);
    doc.text(`Client: ${clientName}`, 20, 65);
    
    // Table header
    doc.setFontSize(10);
    doc.text('Product', 20, 90);
    doc.text('Qty', 120, 90);
    doc.text('Price', 140, 90);
    doc.text('Amount', 170, 90);
    
    // Draw line under header
    doc.line(20, 93, 190, 93);
    
    // Items
    let yPos = 105;
    items.forEach((item) => {
      const amount = item.quantity * item.price;
      doc.text(item.product, 20, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(`₹${item.price.toFixed(2)}`, 140, yPos);
      doc.text(`₹${amount.toFixed(2)}`, 170, yPos);
      yPos += 15;
    });
    
    // Totals
    yPos += 10;
    doc.line(20, yPos, 190, yPos);
    yPos += 15;
    
    doc.text(`Subtotal: ₹${calculateSubtotal().toFixed(2)}`, 130, yPos);
    yPos += 15;
    doc.text(`GST (18%): ₹${calculateGST().toFixed(2)}`, 130, yPos);
    yPos += 15;
    doc.setFontSize(12);
    doc.text(`Total: ₹${calculateTotal().toFixed(2)}`, 130, yPos);
    
    // Store PDF blob for email sending
    const pdfBlob = doc.output('blob');
    setPdfBlob(pdfBlob);
    
    // Also save locally
    doc.save(`invoice-${clientName}-${Date.now()}.pdf`);
    
    // Show email form
    setShowEmailForm(true);
  };

  const sendEmail = async () => {
    if (!clientEmail.trim()) {
      alert('Please enter client email address');
      return;
    }

    if (!pdfBlob) {
      alert('Please generate PDF first');
      return;
    }

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        
        const response = await fetch('http://localhost:3001/send-invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: clientEmail,
            clientName: clientName,
            pdfBase64: base64Data,
            invoiceTotal: calculateTotal().toFixed(2),
            businessName: 'Your Business' // You can make this configurable later
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          alert('✅ Invoice sent successfully!');
          setShowEmailForm(false);
          // Reset form
          setClientName('');
          setClientEmail('');
          setItems([{ product: '', quantity: 1, price: 0 }]);
          setPdfBlob(null);
        } else {
          alert('❌ Failed to send email: ' + result.error);
        }
      };
      
      reader.readAsDataURL(pdfBlob);
    } catch (error) {
      console.error('Email sending error:', error);
      alert('❌ Failed to send email. Please try again.');
    }
  };

  return (
    <div className="simple-form">
      <div className="form-group">
        <label>Client Name:</label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Enter client name"
        />
      </div>

      <div className="form-group">
        <label>Client Email: 📧</label>
        <input
          type="email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          placeholder="Enter client email address"
          style={{ border: '2px solid red' }}
        />
      </div>

      <div className="items-section">
        <h3>Products/Services:</h3>
        
        {items.map((item, index) => (
          <div key={index} className="item-row">
            <input
              type="text"
              placeholder="Product/Service"
              value={item.product}
              onChange={(e) => updateItem(index, 'product', e.target.value)}
              className="product-input"
            />
            <input
              type="number"
              placeholder="Qty"
              min="1"
              value={item.quantity}
              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
              className="quantity-input"
            />
            <input
              type="number"
              placeholder="Price"
              min="0"
              step="0.01"
              value={item.price}
              onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
              className="price-input"
            />
            <span className="amount">₹{(item.quantity * item.price).toFixed(2)}</span>
            {items.length > 1 && (
              <button 
                type="button" 
                onClick={() => removeItem(index)}
                className="remove-btn"
              >
                ×
              </button>
            )}
          </div>
        ))}
        
        <button type="button" onClick={addItem} className="add-btn">
          + Add Item
        </button>
      </div>

      <div className="totals">
        <div className="total-row">
          <span>Subtotal: ₹{calculateSubtotal().toFixed(2)}</span>
        </div>
        <div className="total-row">
          <span>GST (18%): ₹{calculateGST().toFixed(2)}</span>
        </div>
        <div className="total-row total">
          <strong>Total: ₹{calculateTotal().toFixed(2)}</strong>
        </div>
      </div>

      {!showEmailForm ? (
        <button onClick={generatePDF} className="generate-btn">
          Generate Invoice PDF
        </button>
      ) : (
        <div className="email-section">
          <h3>📧 Send Invoice via Email</h3>
          <p>PDF generated! Send it to your client:</p>
          
          <div className="email-actions">
            <button onClick={sendEmail} className="send-email-btn">
              📧 Send Invoice Email
            </button>
            <button 
              onClick={() => setShowEmailForm(false)} 
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleInvoiceForm;