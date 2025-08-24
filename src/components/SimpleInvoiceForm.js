import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import InvoicePreviewModal from './InvoicePreviewModal';
import jsPDF from 'jspdf';

const SimpleInvoiceForm = () => {
  const { deductCredit, canGenerateInvoice } = useAuth();

  // Helper function to convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 33, g: 150, b: 243 };
  };

  // Generate invoice number
  const generateInvoiceNumber = (businessProfile) => {
    const prefix = businessProfile.invoicePrefix || 'INV';
    const startNumber = businessProfile.invoiceStartNumber || 1;
    const currentNumber = (businessProfile.lastInvoiceNumber || (startNumber - 1)) + 1;
    
    // Update last invoice number
    const updatedProfile = { ...businessProfile, lastInvoiceNumber: currentNumber };
    localStorage.setItem('businessProfile', JSON.stringify(updatedProfile));
    
    return `${prefix}-${String(currentNumber).padStart(4, '0')}`;
  };
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [items, setItems] = useState([
    { product: '', quantity: 1, price: 0 }
  ]);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const generatePDF = async () => {
    if (!canGenerateInvoice()) {
      alert('You need to purchase credits to generate more invoices!');
      return;
    }

    if (!clientName.trim()) {
      alert('Please enter client name');
      return;
    }

    if (items.some(item => !item.product.trim())) {
      alert('Please fill in all product names');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Use a credit for this invoice
      const creditUsed = deductCredit();
      if (!creditUsed) {
        alert('Unable to process invoice. Please check your credits.');
        setIsGenerating(false);
        return;
      }

      // Load business profile data
      const businessProfile = JSON.parse(localStorage.getItem('businessProfile') || '{}');
      console.log('Business Profile:', businessProfile);
      console.log('Logo exists:', !!businessProfile.logo);
      
      const doc = new jsPDF();
      
      // Set custom colors
      const primaryColor = businessProfile.primaryColor || '#2196F3';
      const rgbPrimary = hexToRgb(primaryColor);
      
      // Generate invoice number
      const invoiceNumber = generateInvoiceNumber(businessProfile);
      const currencySymbol = businessProfile.currency === 'USD' ? '$' : 
                           businessProfile.currency === 'EUR' ? 'EUR' : 
                           businessProfile.currency === 'GBP' ? 'GBP' : 'INR';
      const displaySymbol = businessProfile.currency === 'USD' ? '$' : 
                           businessProfile.currency === 'EUR' ? '€' : 
                           businessProfile.currency === 'GBP' ? '£' : '₹';
      
      let yPosition = 20;

      // Add a professional border around the entire invoice
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 277); // Outer border
      
      // Business Header Section with Logo on the right
      doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text(businessProfile.businessName || 'Your Business', 20, yPosition + 15);

      // Add business logo on the right side, same line as company name
      if (businessProfile.logo) {
        try {
          // Determine image format from data URL
          let format = 'JPEG';
          if (businessProfile.logo.includes('data:image/png')) {
            format = 'PNG';
          } else if (businessProfile.logo.includes('data:image/jpeg') || businessProfile.logo.includes('data:image/jpg')) {
            format = 'JPEG';
          } else if (businessProfile.logo.includes('data:image/gif')) {
            format = 'GIF';
          }
          
          console.log('Adding logo with format:', format);
          // Position logo on the right side (150x position, same y-level as company name)
          doc.addImage(businessProfile.logo, format, 150, yPosition, 40, 25);
        } catch (error) {
          console.error('Could not add logo to PDF:', error);
          // Continue without logo if there's an error
        }
      }

      yPosition += 30;
      
      // Add a subtle separator line after business header
      doc.setDrawColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
      doc.setLineWidth(1);
      doc.line(20, yPosition, 180, yPosition);
      yPosition += 10;

      // Business details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      if (businessProfile.address) {
        const addressLines = businessProfile.address.split('\n');
        addressLines.forEach(line => {
          if (line.trim()) {
            doc.text(line.trim(), 20, yPosition);
            yPosition += 5; // Consistent 5px spacing between all address lines
          }
        });
        // Removed extra spacing - city/state will have same spacing as address lines
      }
      
      if (businessProfile.city && businessProfile.state) {
        const cityStateText = `${businessProfile.city}, ${businessProfile.state}${businessProfile.pincode ? ' - ' + businessProfile.pincode : ''}`;
        doc.text(cityStateText, 20, yPosition);
        yPosition += 8;
      }
      
      // Contact information section - Phone and Email on same line
      if (businessProfile.phone || businessProfile.email) {
        yPosition += 3;
        
        // Add subtle background for contact section
        doc.setFillColor(250, 252, 255);
        doc.rect(20, yPosition - 2, 160, 10, 'F');
        
        // Add border
        doc.setDrawColor(220, 230, 240);
        doc.setLineWidth(0.3);
        doc.rect(20, yPosition - 2, 160, 10);
        
        if (businessProfile.phone) {
          doc.text(`Phone: ${businessProfile.phone}`, 25, yPosition + 4);
        }
        
        if (businessProfile.email) {
          const emailX = businessProfile.phone ? 105 : 25; // Position based on phone presence
          doc.text(`Email: ${businessProfile.email}`, emailX, yPosition + 4);
        }
        
        yPosition += 12;
      }
      
      // Website and GST section - on same line with better alignment
      if (businessProfile.website || businessProfile.gstNumber) {
        yPosition += 2;
        
        // Calculate section widths for better alignment
        const totalWidth = 160;
        const gap = 5; // Small gap between sections
        const sectionWidth = businessProfile.website && businessProfile.gstNumber ? 
                            (totalWidth - gap) / 2 : totalWidth; // Equal width sections or full width
        
        if (businessProfile.website) {
          // Website section
          doc.setFillColor(248, 255, 248);
          doc.rect(20, yPosition - 2, sectionWidth, 10, 'F');
          doc.setDrawColor(200, 230, 200);
          doc.setLineWidth(0.3);
          doc.rect(20, yPosition - 2, sectionWidth, 10);
          
          // Handle website text wrapping if too long
          const websiteText = `Web: ${businessProfile.website}`;
          const maxWebsiteWidth = sectionWidth - 10;
          const websiteLines = doc.splitTextToSize(websiteText, maxWebsiteWidth);
          doc.text(websiteLines[0], 25, yPosition + 4);
        }
        
        if (businessProfile.gstNumber) {
          // GST section - properly aligned
          const gstX = businessProfile.website ? 20 + sectionWidth + gap : 20;
          
          doc.setFillColor(255, 248, 248);
          doc.rect(gstX, yPosition - 2, sectionWidth, 10, 'F');
          doc.setDrawColor(230, 200, 200);
          doc.setLineWidth(0.3);
          doc.rect(gstX, yPosition - 2, sectionWidth, 10);
          
          // Handle GST text wrapping if too long
          const gstText = `GST: ${businessProfile.gstNumber}`;
          const maxGstWidth = sectionWidth - 10;
          const gstLines = doc.splitTextToSize(gstText, maxGstWidth);
          doc.text(gstLines[0], gstX + 5, yPosition + 4);
        }
        
        yPosition += 12;
      }

      yPosition += 10;

      // Invoice title and number
      doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('INVOICE', 20, yPosition);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Invoice #: ${invoiceNumber}`, 120, yPosition);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, yPosition + 10);
      
      yPosition += 25;

      // Client section with professional border
      const clientSectionStart = yPosition;
      
      // Add light background for client section
      doc.setFillColor(248, 249, 250);
      doc.rect(20, yPosition - 5, 85, 35, 'F');
      
      // Add border around client section
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(20, yPosition - 5, 85, 35);
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Bill To:', 25, yPosition + 5);
      yPosition += 12;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      
      // Handle text wrapping for client name
      const maxClientNameWidth = 75; // Adjusted for border padding
      const clientNameLines = doc.splitTextToSize(clientName, maxClientNameWidth);
      
      // Render client name lines
      clientNameLines.forEach((line, lineIndex) => {
        doc.text(line, 25, yPosition + (lineIndex * 5));
      });
      yPosition += clientNameLines.length * 5;
      
      if (clientEmail) {
        yPosition += 2; // Small gap between name and email
        doc.text(clientEmail, 25, yPosition);
        yPosition += 5;
      }

      yPosition = clientSectionStart + 40; // Ensure consistent spacing

      // Items table header with professional styling
      doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
      doc.rect(20, yPosition - 5, 170, 10, 'F');
      
      // Add border around table header
      doc.setDrawColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
      doc.setLineWidth(0.5);
      doc.rect(20, yPosition - 5, 170, 10);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Description', 22, yPosition);
      doc.text('Qty', 110, yPosition);
      doc.text('Rate', 130, yPosition);
      doc.text('Amount', 160, yPosition);
      
      yPosition += 10;
      
      // Items
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      
      items.forEach((item, index) => {
        // Handle text wrapping for all columns
        const maxProductWidth = 85; // Max width for product description column
        const maxRateWidth = 25; // Max width for rate column
        const maxAmountWidth = 25; // Max width for amount column
        
        const productLines = doc.splitTextToSize(item.product, maxProductWidth);
        const rateText = `${currencySymbol} ${item.price.toFixed(2)}`;
        const rateLines = doc.splitTextToSize(rateText, maxRateWidth);
        const amountText = `${currencySymbol} ${(item.quantity * item.price).toFixed(2)}`;
        const amountLines = doc.splitTextToSize(amountText, maxAmountWidth);
        
        // Calculate the height needed for this item (based on maximum lines across all columns)
        const maxLines = Math.max(productLines.length, rateLines.length, amountLines.length);
        const itemHeight = Math.max(maxLines * 6, 8); // Minimum 8px height
        
        // Check if this item (including wrapped lines) will fit on the current page
        if (yPosition + itemHeight > 240) {
          doc.addPage();
          yPosition = 20;
          
          // Re-add table header on new page
          doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
          doc.rect(20, yPosition - 5, 170, 10, 'F');
          
          // Add border around table header
          doc.setDrawColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
          doc.setLineWidth(0.5);
          doc.rect(20, yPosition - 5, 170, 10);
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text('Description', 22, yPosition);
          doc.text('Qty', 110, yPosition);
          doc.text('Rate', 130, yPosition);
          doc.text('Amount', 160, yPosition);
          yPosition += 10;
          
          // Reset text color for items
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
        }
        
        // Add alternating row background
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250); // Very light gray for even rows
          doc.rect(20, yPosition - 2, 170, itemHeight + 2, 'F');
        }
        
        // Add subtle border around each row
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.2);
        doc.rect(20, yPosition - 2, 170, itemHeight + 2);
        
        // Render all columns with their respective lines
        productLines.forEach((line, lineIndex) => {
          doc.text(line, 22, yPosition + (lineIndex * 6));
        });
        
        // Render quantity at vertical center (since it's unlikely to wrap)
        const centerOffset = Math.floor((itemHeight - 8) / 2);
        doc.text(item.quantity.toString(), 110, yPosition + centerOffset);
        
        // Render rate lines
        rateLines.forEach((line, lineIndex) => {
          doc.text(line, 130, yPosition + (lineIndex * 6));
        });
        
        // Render amount lines
        amountLines.forEach((line, lineIndex) => {
          doc.text(line, 160, yPosition + (lineIndex * 6));
        });
        
        yPosition += itemHeight;
      });
      
      yPosition += 10;
      
      // Check if we need a new page for totals section
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Totals section with professional styling
      const totalsStartY = yPosition;
      
      // Add light background for totals section
      doc.setFillColor(248, 249, 250);
      doc.rect(125, yPosition - 5, 65, 35, 'F');
      
      // Add border around totals section
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(125, yPosition - 5, 65, 35);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Subtotal:`, 130, yPosition + 3);
      doc.text(`${currencySymbol} ${calculateSubtotal().toFixed(2)}`, 160, yPosition + 3);
      yPosition += 8;
      
      // Use custom tax rate from business profile
      const taxRate = businessProfile.taxRate || 18;
      const taxAmount = calculateSubtotal() * (taxRate / 100);
      doc.text(`Tax (${taxRate}%):`, 130, yPosition + 3);
      doc.text(`${currencySymbol} ${taxAmount.toFixed(2)}`, 160, yPosition + 3);
      yPosition += 8;
      
      // Draw line above total with primary color
      doc.setDrawColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
      doc.setLineWidth(1);
      doc.line(130, yPosition + 1, 185, yPosition + 1);
      yPosition += 5;
      
      // Total with enhanced styling
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
      doc.text(`Total:`, 130, yPosition + 3);
      doc.text(`${currencySymbol} ${(calculateSubtotal() + taxAmount).toFixed(2)}`, 160, yPosition + 3);
      
      yPosition = totalsStartY + 40;

      // Bank details (if available) with professional styling
      if (businessProfile.bankName && businessProfile.accountNumber) {
        yPosition += 15;
        
        // Check if we need a new page for bank details
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Add separator line before bank details
        doc.setDrawColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
        doc.setLineWidth(0.5);
        doc.line(20, yPosition - 5, 180, yPosition - 5);
        
        doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Bank Details:', 20, yPosition + 5);
        yPosition += 12;
        
        // Add subtle background for bank details
        const bankDetailsHeight = 25 + (businessProfile.ifscCode ? 7 : 0) + (businessProfile.accountHolderName ? 7 : 0);
        doc.setFillColor(252, 252, 252);
        doc.rect(20, yPosition - 3, 85, bankDetailsHeight, 'F');
        
        // Add border around bank details
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.rect(20, yPosition - 3, 85, bankDetailsHeight);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Bank: ${businessProfile.bankName}`, 25, yPosition + 3);
        yPosition += 6;
        doc.text(`Account: ${businessProfile.accountNumber}`, 25, yPosition + 3);
        yPosition += 6;
        if (businessProfile.ifscCode) {
          doc.text(`IFSC: ${businessProfile.ifscCode}`, 25, yPosition + 3);
          yPosition += 6;
        }
        if (businessProfile.accountHolderName) {
          doc.text(`Account Holder: ${businessProfile.accountHolderName}`, 25, yPosition + 3);
          yPosition += 6;
        }
      }

      // Footer
      yPosition = Math.max(yPosition + 15, 270); // Ensure proper spacing from bank details
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('Thank you for your business!', 20, yPosition);
      doc.text(`Generated on ${new Date().toLocaleDateString()} by Invoice Generator`, 20, yPosition + 5);
    
      // Store PDF blob for email sending
      const pdfBlob = doc.output('blob');
      setPdfBlob(pdfBlob);
      
      // Also save locally
      doc.save(`${invoiceNumber}-${clientName}.pdf`);
      
      // Show email form
      setShowEmailForm(true);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating invoice. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const openEmailPreview = () => {
    if (!clientEmail.trim()) {
      alert('Please enter client email address');
      return;
    }

    if (!pdfBlob) {
      alert('Please generate PDF first');
      return;
    }

    setShowPreviewModal(true);
  };

  const sendEmail = async () => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        // Get business profile for email
        const businessProfile = JSON.parse(localStorage.getItem('businessProfile') || '{}');
        const taxRate = businessProfile.taxRate || 18;
        const taxAmount = calculateSubtotal() * (taxRate / 100);
        const total = calculateSubtotal() + taxAmount;
        const currencySymbol = businessProfile.currency === 'USD' ? '$' : 
                             businessProfile.currency === 'EUR' ? '€' : 
                             businessProfile.currency === 'GBP' ? '£' : '₹';

        const response = await fetch('http://localhost:3001/send-invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: clientEmail,
            pdfData: reader.result, // Send full data URL with header
            invoiceData: {
              clientName: clientName,
              total: `${currencySymbol}${total.toFixed(2)}`,
              businessName: businessProfile.businessName || 'Your Business',
              invoiceNumber: generateInvoiceNumber(businessProfile),
              currency: currencySymbol,
              logo: businessProfile.logo
            }
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          alert('✅ Invoice sent successfully!');
          setShowPreviewModal(false);
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
            <span className="amount">{(() => {
              const businessProfile = JSON.parse(localStorage.getItem('businessProfile') || '{}');
              const currencySymbol = businessProfile.currency === 'USD' ? '$' : 
                                   businessProfile.currency === 'EUR' ? '€' : 
                                   businessProfile.currency === 'GBP' ? '£' : '₹';
              return `${currencySymbol}${(item.quantity * item.price).toFixed(2)}`;
            })()}</span>
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
          <span>Subtotal: {(() => {
            const businessProfile = JSON.parse(localStorage.getItem('businessProfile') || '{}');
            const currencySymbol = businessProfile.currency === 'USD' ? '$' : 
                                 businessProfile.currency === 'EUR' ? '€' : 
                                 businessProfile.currency === 'GBP' ? '£' : '₹';
            return `${currencySymbol}${calculateSubtotal().toFixed(2)}`;
          })()}</span>
        </div>
        <div className="total-row">
          <span>GST (18%): {(() => {
            const businessProfile = JSON.parse(localStorage.getItem('businessProfile') || '{}');
            const currencySymbol = businessProfile.currency === 'USD' ? '$' : 
                                 businessProfile.currency === 'EUR' ? '€' : 
                                 businessProfile.currency === 'GBP' ? '£' : '₹';
            return `${currencySymbol}${calculateGST().toFixed(2)}`;
          })()}</span>
        </div>
        <div className="total-row total">
          <strong>Total: {(() => {
            const businessProfile = JSON.parse(localStorage.getItem('businessProfile') || '{}');
            const currencySymbol = businessProfile.currency === 'USD' ? '$' : 
                                 businessProfile.currency === 'EUR' ? '€' : 
                                 businessProfile.currency === 'GBP' ? '£' : '₹';
            return `${currencySymbol}${calculateTotal().toFixed(2)}`;
          })()}</strong>
        </div>
      </div>

      {!showEmailForm ? (
        <button 
          onClick={generatePDF} 
          className={`generate-btn ${!canGenerateInvoice() ? 'disabled' : ''}`}
          disabled={!canGenerateInvoice() || isGenerating}
        >
          {isGenerating ? 'Generating...' : 
           !canGenerateInvoice() ? 'Purchase Credits to Generate' : 
           'Generate Invoice PDF'}
        </button>
      ) : (
        <div className="email-section">
          <h3>📧 Send Invoice via Email</h3>
          <p>PDF generated! Send it to your client:</p>
          
          <div className="email-actions">
            <button onClick={openEmailPreview} className="send-email-btn">
              📧 Preview & Send Email
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

      {showPreviewModal && (
        <InvoicePreviewModal
          pdfBlob={pdfBlob}
          clientEmail={clientEmail}
          invoiceData={{
            clientName: clientName,
            total: (() => {
              const businessProfile = JSON.parse(localStorage.getItem('businessProfile') || '{}');
              const taxRate = businessProfile.taxRate || 18;
              const taxAmount = calculateSubtotal() * (taxRate / 100);
              const total = calculateSubtotal() + taxAmount;
              const currencySymbol = businessProfile.currency === 'USD' ? '$' : 
                                   businessProfile.currency === 'EUR' ? '€' : 
                                   businessProfile.currency === 'GBP' ? '£' : '₹';
              return `${currencySymbol}${total.toFixed(2)}`;
            })(),
            businessName: JSON.parse(localStorage.getItem('businessProfile') || '{}').businessName || 'Your Business'
          }}
          onConfirm={sendEmail}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
};

export default SimpleInvoiceForm;