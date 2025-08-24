# 📄 Invoice Generator

A mobile-first invoice generator web app built with React for small businesses to create and share professional invoices on the go.

## ✨ Features

- **📱 Mobile-First Design** - Optimized for smartphones with large touch targets
- **🏢 Business Profile** - Save business details in browser storage for reuse
- **👥 Client Management** - Quick client detail input with phone and email
- **📝 Line Items** - Add/remove multiple items with auto-calculation
- **💰 Auto-Calculate** - Automatic subtotal, GST (18%), and total calculation
- **📄 PDF Generation** - Professional invoice PDFs using jsPDF
- **📤 Instant Sharing** - WhatsApp, Email, Download, and native sharing
- **💾 Data Persistence** - Business profile saved in localStorage
- **🚀 PWA Ready** - Progressive Web App with offline capabilities

## 🚀 Quick Start

### Local Development

1. **Clone & Install**
```bash
git clone <repository-url>
cd invoice-generator
npm install
```

2. **Run Development Server**
```bash
npm start
```
Opens at http://localhost:3000

3. **Build for Production**
```bash
npm run build
```

### Deploy to Vercel

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel --prod
```

### Deploy to Netlify

1. **Build the project**
```bash
npm run build
```

2. **Drag and drop the `build` folder** to Netlify dashboard

Or use Netlify CLI:
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=build
```

## 📱 How to Use

1. **Enter Business Details** - Fill in your business information (saved automatically)
2. **Add Client Details** - Enter client name, phone, and email
3. **Add Line Items** - Describe services/products with quantities and rates
4. **Review Totals** - Check auto-calculated subtotal, GST, and total
5. **Generate PDF** - Create professional invoice PDF
6. **Share Instantly** - Send via WhatsApp, email, or download

## 💻 Tech Stack

- **Frontend**: React 18 with Hooks
- **Styling**: Custom CSS with mobile-first responsive design
- **PDF Generation**: jsPDF
- **Email**: EmailJS (optional)
- **PWA**: Service Worker for offline functionality
- **Storage**: Browser localStorage
- **Build**: Create React App

## 📂 Project Structure

```
src/
├── components/
│   ├── InvoiceForm.js      # Main form component
│   ├── LineItems.js        # Items management
│   ├── PDFGenerator.js     # PDF creation logic
│   └── ShareButtons.js     # Sharing functionality
├── App.js                  # Main app component
├── index.js               # React entry point
└── index.css              # Global styles
```

## 🎨 Mobile-First Features

- **44px minimum touch targets** for easy mobile interaction
- **Responsive breakpoints** for phone, tablet, and desktop
- **Sticky action buttons** on mobile for easy access
- **Large form fields** optimized for mobile keyboards
- **Smooth transitions** and loading states
- **Native share API** support on mobile devices

## 🔧 Configuration

### GST Rate
Currently set to 18%. Modify in `InvoiceForm.js`:
```javascript
const gstAmount = subtotal * 0.18; // Change 0.18 to desired rate
```

### Email Integration
To enable email functionality, sign up for EmailJS and add your credentials.

## 📄 Invoice Features

- **Professional Layout** with business and client details
- **Itemized Table** with descriptions, quantities, rates, and amounts
- **GST Breakdown** showing subtotal, GST amount, and total
- **Auto-Generated Invoice Numbers** with timestamp
- **Clean Typography** optimized for printing
- **Date Management** with invoice and due dates

## 🌐 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Android Chrome
- **PWA**: Installable on supported devices
- **Offline**: Basic functionality available offline

## 📦 Deployment Options

### Vercel (Recommended)
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Perfect for React apps

### Netlify
- Drag-and-drop deployment
- Form handling capabilities
- Split testing features
- Branch previews

### GitHub Pages
```bash
npm install --save-dev gh-pages
# Add to package.json scripts:
# "deploy": "gh-pages -d build"
npm run deploy
```

## 🔒 Security & Privacy

- **No Server Required** - Runs entirely in browser
- **Local Storage Only** - Business data stays on device
- **No Data Collection** - Privacy-focused design
- **Secure PDF Generation** - Client-side processing

## 🚀 Performance

- **Lightweight Bundle** - Optimized for mobile networks
- **Code Splitting** - Fast initial load
- **Service Worker** - Offline functionality
- **Gzipped Assets** - Reduced bandwidth usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

MIT License - feel free to use for commercial projects.

## 🐛 Issues & Support

For bugs and feature requests, please open an issue on GitHub.

---

**Perfect for:** Freelancers, Small Businesses, Consultants, Service Providers

**Built with ❤️ for mobile-first invoice generation**