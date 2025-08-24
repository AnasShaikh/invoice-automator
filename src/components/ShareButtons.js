import React, { useState } from 'react';

const ShareButtons = ({ pdfBlob, invoiceData }) => {
  const [isSharing, setIsSharing] = useState(false);

  const downloadPDF = () => {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoiceData.client.name || 'client'}-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareViaWhatsApp = () => {
    const clientPhone = invoiceData.client.phone?.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hi ${invoiceData.client.name || 'there'}! Please find your invoice attached. Thank you for your business!`
    );
    
    const whatsappUrl = clientPhone 
      ? `https://wa.me/${clientPhone}?text=${message}`
      : `https://web.whatsapp.com/send?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = async () => {
    setIsSharing(true);
    
    try {
      const reader = new FileReader();
      reader.onload = function() {
        
        const subject = encodeURIComponent(`Invoice from ${invoiceData.business.name || 'Business'}`);
        const body = encodeURIComponent(
          `Dear ${invoiceData.client.name || 'Client'},\n\nPlease find your invoice attached.\n\nThank you for your business!\n\nBest regards,\n${invoiceData.business.name || 'Your Business'}`
        );
        
        const mailtoUrl = `mailto:${invoiceData.client.email || ''}?subject=${subject}&body=${body}`;
        window.location.href = mailtoUrl;
      };
      
      reader.readAsDataURL(pdfBlob);
    } catch (error) {
      console.error('Error sharing via email:', error);
      alert('Error preparing email. Please try downloading the PDF instead.');
    } finally {
      setIsSharing(false);
    }
  };


  const shareNative = async () => {
    if (navigator.share) {
      try {
        const file = new File([pdfBlob], `invoice-${Date.now()}.pdf`, { type: 'application/pdf' });
        await navigator.share({
          title: 'Invoice',
          text: `Invoice from ${invoiceData.business.name || 'Business'}`,
          files: [file]
        });
      } catch (error) {
        console.error('Error sharing:', error);
        downloadPDF();
      }
    } else {
      downloadPDF();
    }
  };

  return (
    <div className="share-buttons">
      <button 
        className="btn btn-success btn-full"
        onClick={downloadPDF}
      >
        📥 Download PDF
      </button>
      
      <button 
        className="btn btn-success btn-full"
        onClick={shareViaWhatsApp}
      >
        📱 Share via WhatsApp
      </button>
      
      {invoiceData.client.email && (
        <button 
          className="btn btn-primary btn-full"
          onClick={shareViaEmail}
          disabled={isSharing}
        >
          {isSharing ? '📧 Preparing...' : '📧 Email Invoice'}
        </button>
      )}
      
      {navigator.share && (
        <button 
          className="btn btn-outline btn-full"
          onClick={shareNative}
        >
          🔗 Share
        </button>
      )}
      
      <button 
        className="btn btn-outline btn-full"
        onClick={() => window.location.reload()}
      >
        📄 Create New Invoice
      </button>
    </div>
  );
};

export default ShareButtons;