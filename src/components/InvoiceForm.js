import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LineItems from './LineItems';
import PDFGenerator from './PDFGenerator';
import ShareButtons from './ShareButtons';

const InvoiceForm = ({ invoiceData, setInvoiceData, saveBusiness }) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleBusinessChange = (e) => {
    const { name, value } = e.target;
    const updatedBusiness = {
      ...invoiceData.business,
      [name]: value
    };
    
    setInvoiceData(prev => ({
      ...prev,
      business: updatedBusiness
    }));
    
    saveBusiness(updatedBusiness);
  };

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({
      ...prev,
      client: {
        ...prev.client,
        [name]: value
      }
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotals = () => {
    const subtotal = invoiceData.lineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
    }, 0);
    
    const gstAmount = subtotal * 0.18;
    const total = subtotal + gstAmount;
    
    return {
      subtotal: subtotal.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const totals = calculateTotals();

  const saveInvoiceToHistory = (invoiceData, totals) => {
    if (!user) return;
    
    const invoice = {
      id: Date.now().toString(),
      ...invoiceData,
      totals,
      createdAt: new Date().toISOString(),
      userId: user.id
    };
    
    const existingInvoices = JSON.parse(localStorage.getItem(`invoices_${user.id}`) || '[]');
    existingInvoices.unshift(invoice);
    
    // Keep only last 50 invoices
    const limitedInvoices = existingInvoices.slice(0, 50);
    localStorage.setItem(`invoices_${user.id}`, JSON.stringify(limitedInvoices));
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const pdfGenerator = new PDFGenerator();
      const blob = await pdfGenerator.generateInvoice(invoiceData, totals);
      setPdfBlob(blob);
      
      // Save invoice to user's history
      saveInvoiceToHistory(invoiceData, totals);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="invoice-form">
      <div className="form-section">
        <h3>Business Details</h3>
        <div className="form-group">
          <label htmlFor="businessName">Business Name *</label>
          <input
            type="text"
            id="businessName"
            name="name"
            value={invoiceData.business.name}
            onChange={handleBusinessChange}
            placeholder="Your Business Name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="businessAddress">Address *</label>
          <textarea
            id="businessAddress"
            name="address"
            value={invoiceData.business.address}
            onChange={handleBusinessChange}
            placeholder="Business Address"
            rows="3"
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gst">GST Number</label>
            <input
              type="text"
              id="gst"
              name="gst"
              value={invoiceData.business.gst}
              onChange={handleBusinessChange}
              placeholder="GST Number (optional)"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="businessPhone">Phone *</label>
            <input
              type="tel"
              id="businessPhone"
              name="phone"
              value={invoiceData.business.phone}
              onChange={handleBusinessChange}
              placeholder="Phone Number"
              required
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Client Details</h3>
        <div className="form-group">
          <label htmlFor="clientName">Client Name *</label>
          <input
            type="text"
            id="clientName"
            name="name"
            value={invoiceData.client.name}
            onChange={handleClientChange}
            placeholder="Client Name"
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="clientPhone">Phone *</label>
            <input
              type="tel"
              id="clientPhone"
              name="phone"
              value={invoiceData.client.phone}
              onChange={handleClientChange}
              placeholder="Client Phone"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="clientEmail">Email</label>
            <input
              type="email"
              id="clientEmail"
              name="email"
              value={invoiceData.client.email}
              onChange={handleClientChange}
              placeholder="Client Email (optional)"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Invoice Details</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="invoiceDate">Invoice Date *</label>
            <input
              type="date"
              id="invoiceDate"
              name="invoiceDate"
              value={invoiceData.invoiceDate}
              onChange={handleDateChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="dueDate">Due Date *</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={invoiceData.dueDate}
              onChange={handleDateChange}
              required
            />
          </div>
        </div>
      </div>

      <LineItems 
        lineItems={invoiceData.lineItems}
        setInvoiceData={setInvoiceData}
      />

      <div className="totals">
        <div className="total-row">
          <span>Subtotal:</span>
          <span>₹{totals.subtotal}</span>
        </div>
        <div className="total-row">
          <span>GST (18%):</span>
          <span>₹{totals.gstAmount}</span>
        </div>
        <div className="total-row final">
          <span>Total:</span>
          <span>₹{totals.total}</span>
        </div>
      </div>

      {showSuccess && (
        <div className="success">
          ✅ Invoice PDF generated successfully!
        </div>
      )}

      <div className="actions">
        {!pdfBlob ? (
          <button 
            className="btn btn-primary btn-full"
            onClick={handleGeneratePDF}
            disabled={isGenerating}
          >
            {isGenerating ? '📄 Generating PDF...' : '📄 Generate Invoice PDF'}
          </button>
        ) : (
          <ShareButtons pdfBlob={pdfBlob} invoiceData={invoiceData} />
        )}
      </div>
    </div>
  );
};

export default InvoiceForm;