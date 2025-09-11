// Transaction-based investment tracking types
// Supports multiple purchases, sales, and position management

export interface Transaction {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  quantity: number
  pricePerShare: number
  date: string
  totalAmount: number // quantity * pricePerShare + fees
  fees?: number
  notes?: string
}

export interface Position {
  symbol: string
  totalShares: number // Current shares owned (after buys/sells)
  averageCostPerShare: number // Weighted average cost basis
  totalInvested: number // Total money put in (net of sales)
  realizedGainLoss: number // Profit/loss from completed sales
  unrealizedGainLoss?: number // Current paper gain/loss
  currentValue?: number // Current market value
  transactions: Transaction[] // All buy/sell transactions
  lastUpdated: string
}

export interface Portfolio {
  positions: Position[]
  totalInvested: number
  totalCurrentValue: number
  totalRealizedGainLoss: number
  totalUnrealizedGainLoss: number
  totalGainLoss: number
  lastUpdated: string
}

// Helper functions for transaction calculations
export class TransactionCalculator {
  
  // Calculate position from all transactions for a symbol
  static calculatePosition(transactions: Transaction[]): Position | null {
    if (transactions.length === 0) return null
    
    const symbol = transactions[0].symbol
    let totalShares = 0
    let totalInvested = 0
    let realizedGainLoss = 0
    let buyTransactions: Transaction[] = []
    
    // Sort transactions by date to process chronologically
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    for (const transaction of sortedTransactions) {
      if (transaction.type === 'BUY') {
        totalShares += transaction.quantity
        totalInvested += transaction.totalAmount
        buyTransactions.push(transaction)
      } else if (transaction.type === 'SELL') {
        if (totalShares < transaction.quantity) {
          throw new Error(`Cannot sell ${transaction.quantity} shares of ${symbol}. Only ${totalShares} shares available.`)
        }
        
        // Calculate realized gain/loss using FIFO (First In, First Out)
        let sharesToSell = transaction.quantity
        let costBasisOfSoldShares = 0
        
        while (sharesToSell > 0 && buyTransactions.length > 0) {
          const oldestBuy = buyTransactions[0]
          const sharesToTakeFromThisBuy = Math.min(sharesToSell, oldestBuy.quantity)
          const costPerShare = oldestBuy.pricePerShare
          
          costBasisOfSoldShares += sharesToTakeFromThisBuy * costPerShare
          sharesToSell -= sharesToTakeFromThisBuy
          oldestBuy.quantity -= sharesToTakeFromThisBuy
          
          if (oldestBuy.quantity === 0) {
            buyTransactions.shift() // Remove fully used buy transaction
          }
        }
        
        totalShares -= transaction.quantity
        totalInvested -= costBasisOfSoldShares
        realizedGainLoss += (transaction.totalAmount - costBasisOfSoldShares)
      }
    }
    
    // Calculate average cost per share
    const averageCostPerShare = totalShares > 0 ? totalInvested / totalShares : 0
    
    return {
      symbol,
      totalShares,
      averageCostPerShare,
      totalInvested,
      realizedGainLoss,
      transactions: transactions,
      lastUpdated: new Date().toISOString()
    }
  }
  
  // Calculate portfolio summary from all positions
  static calculatePortfolio(positions: Position[]): Portfolio {
    let totalInvested = 0
    let totalCurrentValue = 0
    let totalRealizedGainLoss = 0
    let totalUnrealizedGainLoss = 0
    
    for (const position of positions) {
      totalInvested += position.totalInvested
      totalCurrentValue += position.currentValue || 0
      totalRealizedGainLoss += position.realizedGainLoss
      totalUnrealizedGainLoss += position.unrealizedGainLoss || 0
    }
    
    return {
      positions,
      totalInvested,
      totalCurrentValue,
      totalRealizedGainLoss,
      totalUnrealizedGainLoss,
      totalGainLoss: totalRealizedGainLoss + totalUnrealizedGainLoss,
      lastUpdated: new Date().toISOString()
    }
  }
  
  // Validate a sell transaction
  static validateSellTransaction(symbol: string, quantity: number, existingTransactions: Transaction[]): { valid: boolean; message: string; availableShares: number } {
    const position = this.calculatePosition(existingTransactions.filter(t => t.symbol === symbol))
    const availableShares = Math.round((position?.totalShares || 0) * 100000) / 100000
    const roundedQuantity = Math.round(quantity * 100000) / 100000
    
    if (roundedQuantity > availableShares) {
      return {
        valid: false,
        message: `Cannot sell ${roundedQuantity} shares. Only ${availableShares} shares available.`,
        availableShares
      }
    }
    
    return {
      valid: true,
      message: 'Valid transaction',
      availableShares
    }
  }
}
