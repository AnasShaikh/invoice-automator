import React, { useState, useEffect } from 'react';
import './InvoicePreviewModal.css';

const InvoicePreviewModal = ({ pdfBlob, invoiceData, clientEmail, onConfirm, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [pdfBlob]);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="invoice-preview-overlay">
      <div className="invoice-preview-modal">
        <div className="preview-header">
          <h2>📄 Invoice Preview</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="preview-content">
          <div className="preview-info">
            <div className="email-details">
              <p><strong>Sending to:</strong> {clientEmail}</p>
              <p><strong>Client:</strong> {invoiceData.clientName}</p>
              <p><strong>Total:</strong> ₹{invoiceData.total}</p>
            </div>
          </div>

          <div className="pdf-preview">
            {pdfUrl ? (
              <iframe 
                src={pdfUrl}
                title="Invoice Preview"
                width="100%"
                height="400px"
                style={{ border: '1px solid #e0e0e0', borderRadius: '8px' }}
              />
            ) : (
              <div className="pdf-loading">
                <p>Loading invoice preview...</p>
              </div>
            )}
          </div>

          <div className="email-preview">
            <h3>📧 Email Preview</h3>
            <div className="email-content">
              <div className="email-header">
                <p><strong>Subject:</strong> Invoice from {invoiceData.businessName}</p>
                <p><strong>To:</strong> {clientEmail}</p>
              </div>
              
              <div className="email-body-preview">
                <div className="email-template">
                  <h4>Invoice Attached</h4>
                  <p>Dear {invoiceData.clientName},</p>
                  
                  <p>Please find your invoice attached to this email.</p>
                  
                  <div className="invoice-summary-box">
                    <h5>Invoice Summary:</h5>
                    <p><strong>Total Amount:</strong> ₹{invoiceData.total}</p>
                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                  </div>
                  
                  <p>If you have any questions, please don't hesitate to contact us.</p>
                  
                  <p>Thank you for your business!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="preview-actions">
          <button 
            className="cancel-btn" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="confirm-send-btn"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : '📧 Confirm & Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;