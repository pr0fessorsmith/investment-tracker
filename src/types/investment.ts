// Investment types and interfaces
export interface Investment {
  id: string
  symbol: string
  shares: number
  purchasePrice: number // User's actual purchase price
  purchaseDate: string
  currentPrice?: number // Current market price
  historicalPrice?: number // Market price on purchase date
  realizedGainLoss?: number // Difference between user price and historical market price
  unrealizedGainLoss?: number // Current gain/loss from historical price
  totalGainLoss?: number // Total gain/loss from user's purchase price
  lastUpdated?: string
}

export interface PortfolioSummary {
  totalInvested: number
  currentValue: number
  totalGainLoss: number
  totalGainLossPercent: number
  dayChange: number
  dayChangePercent: number
  lastUpdated: string
}
