// API Configuration
// Server-side API configuration for secure API key handling

export const API_CONFIG = {
  // Use server-side API route instead of direct Alpha Vantage calls
  STOCK_API_BASE_URL: '/api/stock'
}

// Debug function to check API connectivity
export const debugEnvironment = () => {
  console.log('Environment Debug:')
  console.log('- Using server-side API routes for secure Alpha Vantage access')
  console.log('- Stock API endpoint:', API_CONFIG.STOCK_API_BASE_URL)
}
