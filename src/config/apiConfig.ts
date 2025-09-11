// API Configuration
// This ensures environment variables are properly loaded

export const API_CONFIG = {
  ALPHA_VANTAGE_API_KEY: 'TNRN5PTG8FS0OG03', // Your Alpha Vantage API key
  BASE_URL: 'https://www.alphavantage.co/query'
}

// Debug function to check environment loading
export const debugEnvironment = () => {
  console.log('Environment Debug:')
  console.log('- API Key configured:', API_CONFIG.ALPHA_VANTAGE_API_KEY ? '✅ Ready' : '❌ Missing')
  console.log('- Using key:', API_CONFIG.ALPHA_VANTAGE_API_KEY.substring(0, 8) + '...')
}
