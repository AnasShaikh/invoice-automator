import React from 'react';

const LineItems = ({ lineItems, setInvoiceData }) => {
  
  const handleLineItemChange = (index, field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addLineItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: '', quantity: 1, rate: 0 }]
    }));
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      setInvoiceData(prev => ({
        ...prev,
        lineItems: prev.lineItems.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateLineAmount = (quantity, rate) => {
    return ((parseFloat(quantity) || 0) * (parseFloat(rate) || 0)).toFixed(2);
  };

  return (
    <div className="form-section">
      <h3>Items & Services</h3>
      
      <div className="line-items">
        {lineItems.map((item, index) => (
          <div key={index} className="line-item">
            <input
              type="text"
              className="description"
              placeholder="Description of item/service"
              value={item.description}
              onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
              required
            />
            
            <input
              type="number"
              className="quantity"
              placeholder="Qty"
              min="1"
              value={item.quantity}
              onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
              required
            />
            
            <input
              type="number"
              className="rate"
              placeholder="Rate"
              min="0"
              step="0.01"
              value={item.rate}
              onChange={(e) => handleLineItemChange(index, 'rate', e.target.value)}
              required
            />
            
            <input
              type="text"
              className="amount"
              value={`₹${calculateLineAmount(item.quantity, item.rate)}`}
              readOnly
            />
            
            {lineItems.length > 1 && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeLineItem(index)}
                aria-label="Remove item"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      
      <button
        type="button"
        className="btn btn-outline"
        onClick={addLineItem}
      >
        + Add Item
      </button>
    </div>
  );
};

export default LineItems;