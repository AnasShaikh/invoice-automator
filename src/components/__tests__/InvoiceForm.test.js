import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InvoiceForm from '../InvoiceForm';

jest.mock('../PDFGenerator', () => ({
  generatePDF: jest.fn(() => Promise.resolve('mock-pdf-blob'))
}));

describe('InvoiceForm Component', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders invoice form with all required fields', () => {
    render(<InvoiceForm />);
    
    expect(screen.getByText('Invoice Generator')).toBeInTheDocument();
    expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByText(/add item/i)).toBeInTheDocument();
  });

  test('calculates totals correctly', async () => {
    render(<InvoiceForm />);
    
    const addItemButton = screen.getByText(/add item/i);
    fireEvent.click(addItemButton);
    
    const descriptionInput = screen.getByPlaceholderText(/item description/i);
    const quantityInput = screen.getByPlaceholderText(/quantity/i);
    const rateInput = screen.getByPlaceholderText(/rate/i);
    
    fireEvent.change(descriptionInput, { target: { value: 'Test Service' } });
    fireEvent.change(quantityInput, { target: { value: '2' } });
    fireEvent.change(rateInput, { target: { value: '100' } });
    
    await waitFor(() => {
      expect(screen.getByText('₹200.00')).toBeInTheDocument(); // Subtotal
      expect(screen.getByText('₹36.00')).toBeInTheDocument();  // GST (18%)
      expect(screen.getByText('₹236.00')).toBeInTheDocument(); // Total
    });
  });

  test('saves business profile to localStorage', () => {
    render(<InvoiceForm />);
    
    const businessNameInput = screen.getByLabelText(/business name/i);
    const addressInput = screen.getByLabelText(/address/i);
    
    fireEvent.change(businessNameInput, { target: { value: 'Test Business' } });
    fireEvent.change(addressInput, { target: { value: '123 Test St' } });
    
    fireEvent.blur(businessNameInput);
    
    const savedProfile = JSON.parse(localStorage.getItem('businessProfile'));
    expect(savedProfile.businessName).toBe('Test Business');
    expect(savedProfile.address).toBe('123 Test St');
  });

  test('validates required fields before generating invoice', async () => {
    render(<InvoiceForm />);
    
    const generateButton = screen.getByText(/generate invoice/i);
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument();
    });
  });

  test('adds and removes line items correctly', () => {
    render(<InvoiceForm />);
    
    const addItemButton = screen.getByText(/add item/i);
    
    // Add first item
    fireEvent.click(addItemButton);
    expect(screen.getAllByPlaceholderText(/item description/i)).toHaveLength(1);
    
    // Add second item
    fireEvent.click(addItemButton);
    expect(screen.getAllByPlaceholderText(/item description/i)).toHaveLength(2);
    
    // Remove an item
    const removeButtons = screen.getAllByText(/remove/i);
    fireEvent.click(removeButtons[0]);
    expect(screen.getAllByPlaceholderText(/item description/i)).toHaveLength(1);
  });
});