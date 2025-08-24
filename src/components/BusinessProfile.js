import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './BusinessProfile.css';

const BusinessProfile = ({ onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    website: '',
    gstNumber: '',
    
    // Bank Details
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    
    // Branding
    logo: null,
    primaryColor: '#2196F3',
    secondaryColor: '#21cbf3',
    
    // Invoice Settings
    invoicePrefix: 'INV',
    invoiceStartNumber: 1,
    taxRate: 18,
    currency: 'INR'
  });

  const [logoPreview, setLogoPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load existing business profile
    const savedProfile = localStorage.getItem('businessProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setFormData(prev => ({ ...prev, ...profile }));
      if (profile.logo) {
        setLogoPreview(profile.logo);
      }
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('Logo file size should be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const logoData = event.target.result;
        setLogoPreview(logoData);
        setFormData(prev => ({
          ...prev,
          logo: logoData
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Save to localStorage (later we can save to PocketBase)
      const profileToSave = {
        ...formData,
        userId: user?.id,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('businessProfile', JSON.stringify(profileToSave));
      
      alert('✅ Business profile saved successfully!');
      if (onClose) onClose();
      
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('❌ Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeLogo = () => {
    setLogoPreview('');
    setFormData(prev => ({
      ...prev,
      logo: null
    }));
  };

  return (
    <div className="business-profile-overlay">
      <div className="business-profile-container">
        <div className="profile-header">
          <h2>🏢 Business Profile Settings</h2>
          {onClose && (
            <button className="close-btn" onClick={onClose}>×</button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="business-form">
          
          {/* Business Information */}
          <div className="form-section">
            <h3>📋 Business Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Business Name *</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Your Business Name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="business@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>

              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="form-group">
                <label>GST Number</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="form-section">
            <h3>📍 Address Information</h3>
            <div className="form-group">
              <label>Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Complete business address"
                rows="3"
                required
              />
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Mumbai"
                  required
                />
              </div>

              <div className="form-group">
                <label>State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="Maharashtra"
                  required
                />
              </div>

              <div className="form-group">
                <label>PIN Code *</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  placeholder="400001"
                  pattern="[0-9]{6}"
                  required
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="form-section">
            <h3>🏦 Bank Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="State Bank of India"
                />
              </div>

              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="1234567890"
                />
              </div>

              <div className="form-group">
                <label>IFSC Code</label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  placeholder="SBIN0001234"
                />
              </div>

              <div className="form-group">
                <label>Account Holder Name</label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleInputChange}
                  placeholder="Business Name or Owner Name"
                />
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="form-section">
            <h3>🎨 Branding</h3>
            <div className="logo-upload-section">
              <label>Business Logo</label>
              <div className="logo-upload-area">
                {logoPreview ? (
                  <div className="logo-preview">
                    <img src={logoPreview} alt="Logo Preview" />
                    <button type="button" className="remove-logo" onClick={removeLogo}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="logo-upload-placeholder">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="logo-input"
                    />
                    <label htmlFor="logo-upload" className="logo-upload-btn">
                      📁 Upload Logo
                    </label>
                    <p>PNG, JPG up to 2MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Primary Color</label>
                <input
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleInputChange}
                  className="color-picker"
                />
              </div>

              <div className="form-group">
                <label>Secondary Color</label>
                <input
                  type="color"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleInputChange}
                  className="color-picker"
                />
              </div>
            </div>
          </div>

          {/* Invoice Settings */}
          <div className="form-section">
            <h3>📄 Invoice Settings</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Invoice Prefix</label>
                <input
                  type="text"
                  name="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={handleInputChange}
                  placeholder="INV"
                />
              </div>

              <div className="form-group">
                <label>Starting Invoice Number</label>
                <input
                  type="number"
                  name="invoiceStartNumber"
                  value={formData.invoiceStartNumber}
                  onChange={handleInputChange}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Tax Rate (%)</label>
                <input
                  type="number"
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label>Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="save-profile-btn"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : '💾 Save Business Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessProfile;