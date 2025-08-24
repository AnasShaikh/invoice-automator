import React from 'react';
import AuthWrapper from './components/AuthWrapper';
import SimpleInvoiceForm from './components/SimpleInvoiceForm';
import './App.css';

function App() {
  return (
    <div className="App">
      <AuthWrapper>
        <div className="simple-container">
          <h1>Invoice Generator</h1>
          <SimpleInvoiceForm />
        </div>
      </AuthWrapper>
    </div>
  );
}

export default App;