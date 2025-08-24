// Utility to suppress MetaMask warnings and auto-connection attempts
export const suppressMetaMask = () => {
  // Suppress MetaMask console warnings
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  console.warn = function(...args) {
    const message = args.join(' ').toLowerCase();
    if (
      message.includes('metamask') ||
      message.includes('ethereum') ||
      message.includes('web3') ||
      message.includes('injected provider') ||
      message.includes('failed to connect to metamask')
    ) {
      // Suppress MetaMask-related warnings
      return;
    }
    return originalConsoleWarn.apply(console, args);
  };
  
  console.error = function(...args) {
    const message = args.join(' ').toLowerCase();
    if (
      message.includes('metamask') ||
      message.includes('ethereum') ||
      message.includes('web3') ||
      message.includes('failed to connect to metamask') ||
      message.includes('metamask extension not found')
    ) {
      // Suppress MetaMask-related errors
      return;
    }
    return originalConsoleError.apply(console, args);
  };

  // Disable window.ethereum if present but not needed
  if (typeof window !== 'undefined' && window.ethereum) {
    // Create a proxy to intercept and block unwanted calls
    const handler = {
      get(target, prop) {
        if (prop === 'request' || prop === 'send' || prop === 'enable') {
          return function() {
            // Silently reject MetaMask calls
            return Promise.reject(new Error('MetaMask disabled for this app'));
          };
        }
        return target[prop];
      }
    };
    
    // Don't completely remove ethereum object, just make it non-functional
    // This prevents MetaMask from trying to reconnect
    Object.defineProperty(window, 'ethereum', {
      value: new Proxy(window.ethereum, handler),
      writable: false,
      configurable: false
    });
  }
};

// Auto-suppress on import
if (typeof window !== 'undefined') {
  suppressMetaMask();
}