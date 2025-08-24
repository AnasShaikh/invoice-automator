import jsPDF from 'jspdf';

class PDFGenerator {
  constructor() {
    this.doc = null;
  }

  async generateInvoice(invoiceData, totals) {
    this.doc = new jsPDF();
    
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-6);
    
    this.addHeader(invoiceData.business, invoiceNumber);
    this.addClientInfo(invoiceData.client, invoiceData.invoiceDate, invoiceData.dueDate);
    this.addLineItems(invoiceData.lineItems, totals);
    this.addFooter();
    
    const pdfBlob = this.doc.output('blob');
    return pdfBlob;
  }

  addHeader(business, invoiceNumber) {
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('INVOICE', 20, 30);
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Invoice #: ${invoiceNumber}`, 20, 45);
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(business.name || 'Business Name', 130, 30);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    
    const addressLines = (business.address || '').split('\n');
    let yPos = 40;
    addressLines.forEach(line => {
      if (line.trim()) {
        this.doc.text(line.trim(), 130, yPos);
        yPos += 5;
      }
    });
    
    if (business.gst) {
      this.doc.text(`GST: ${business.gst}`, 130, yPos);
      yPos += 5;
    }
    
    if (business.phone) {
      this.doc.text(`Phone: ${business.phone}`, 130, yPos);
    }
    
    this.doc.line(20, 70, 190, 70);
  }

  addClientInfo(client, invoiceDate, dueDate) {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Bill To:', 20, 85);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text(client.name || 'Client Name', 20, 95);
    
    if (client.phone) {
      this.doc.text(`Phone: ${client.phone}`, 20, 105);
    }
    
    if (client.email) {
      this.doc.text(`Email: ${client.email}`, 20, 115);
    }
    
    this.doc.text(`Invoice Date: ${this.formatDate(invoiceDate)}`, 130, 85);
    this.doc.text(`Due Date: ${this.formatDate(dueDate)}`, 130, 95);
  }

  addLineItems(lineItems, totals) {
    const startY = 140;
    let currentY = startY;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    
    const headers = ['Description', 'Qty', 'Rate', 'Amount'];
    const columnX = [20, 110, 130, 160];
    
    headers.forEach((header, index) => {
      this.doc.text(header, columnX[index], currentY);
    });
    
    this.doc.line(20, currentY + 3, 190, currentY + 3);
    currentY += 15;
    
    this.doc.setFont('helvetica', 'normal');
    
    lineItems.forEach(item => {
      const amount = ((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toFixed(2);
      
      const description = this.doc.splitTextToSize(item.description || '', 85);
      const maxLines = Math.max(description.length, 1);
      
      this.doc.text(description, columnX[0], currentY);
      this.doc.text(String(item.quantity || ''), columnX[1], currentY);
      this.doc.text(`₹${parseFloat(item.rate || 0).toFixed(2)}`, columnX[2], currentY);
      this.doc.text(`₹${amount}`, columnX[3], currentY);
      
      currentY += maxLines * 5 + 5;
      
      if (currentY > 250) {
        this.doc.addPage();
        currentY = 30;
      }
    });
    
    this.doc.line(20, currentY, 190, currentY);
    currentY += 15;
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Subtotal:', 130, currentY);
    this.doc.text(`₹${totals.subtotal}`, 160, currentY);
    currentY += 10;
    
    this.doc.text('GST (18%):', 130, currentY);
    this.doc.text(`₹${totals.gstAmount}`, 160, currentY);
    currentY += 10;
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('Total:', 130, currentY);
    this.doc.text(`₹${totals.total}`, 160, currentY);
    
    this.doc.line(130, currentY + 3, 190, currentY + 3);
  }

  addFooter() {
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Thank you for your business!', 20, 280);
    this.doc.text(`Generated on ${this.formatDate(new Date().toISOString().split('T')[0])}`, 130, 280);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

export default PDFGenerator;