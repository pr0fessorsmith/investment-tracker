'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Activity, Eye, Trash2, Plus, Minus, Edit, ChevronUp } from 'lucide-react'
import { financeService } from '../services/financeService'
import { Transaction, Position, Portfolio as PortfolioType, TransactionCalculator } from '../types/transactions'

interface TransactionPortfolioProps {
  transactions: Transaction[]
  onDeleteTransaction: (transactionId: string) => void
  onEditTransaction: (transaction: Transaction) => void
  onDataRecovery?: () => void
  onTestLocalStorage?: () => void
}

export default function TransactionPortfolio({ transactions, onDeleteTransaction, onEditTransaction, onDataRecovery, onTestLocalStorage }: TransactionPortfolioProps) {
  const [portfolio, setPortfolio] = useState<PortfolioType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null)

  const calculatePortfolio = useCallback(async () => {
    if (transactions.length === 0) {
      setPortfolio(null)
      return
    }

    setIsLoading(true)
    try {
      // Group transactions by symbol
      const transactionsBySymbol = transactions.reduce((acc, transaction) => {
        if (!acc[transaction.symbol]) {
          acc[transaction.symbol] = []
        }
        acc[transaction.symbol].push(transaction)
        return acc
      }, {} as Record<string, Transaction[]>)

      // Calculate positions for each symbol
      const positions: Position[] = []
      for (const [symbol, symbolTransactions] of Object.entries(transactionsBySymbol)) {
        const position = TransactionCalculator.calculatePosition(symbolTransactions)
        if (position && position.totalShares > 0) { // Only include positions with shares
          // Get current market price
          try {
            const currentPrice = await financeService.getCurrentPrice(symbol)
            if (currentPrice) {
              position.currentValue = position.totalShares * currentPrice.currentPrice
              position.unrealizedGainLoss = position.currentValue - position.totalInvested
            }
          } catch (error) {
            console.error(`Error getting price for ${symbol}:`, error)
          }
          positions.push(position)
        }
      }

      // Calculate portfolio totals
      const portfolioData = TransactionCalculator.calculatePortfolio(positions)
      setPortfolio(portfolioData)
    } catch (error) {
      console.error('Error calculating portfolio:', error)
    } finally {
      setIsLoading(false)
    }
  }, [transactions])

  // Calculate portfolio from transactions
  useEffect(() => {
    calculatePortfolio()
  }, [calculatePortfolio])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%'
    return ((value / total) * 100).toFixed(2) + '%'
  }

  const getGainLossColor = (amount: number) => {
    if (amount > 0) return 'text-green-600 dark:text-green-400'
    if (amount < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Transactions Found</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your transaction data appears to be missing. This may have happened during recent updates.
        </p>
        <div className="space-y-3">
          {onTestLocalStorage && (
            <button
              onClick={onTestLocalStorage}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mr-3"
            >
              Test LocalStorage
            </button>
          )}
          {onDataRecovery && (
            <button
              onClick={onDataRecovery}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Sample Data
            </button>
          )}
        </div>
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Data Recovery Options:</h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p>• Check if you have the app open in another tab</p>
            <p>• Look in browser history for previous data</p>
            <p>• Use &quot;Add Sample Data&quot; to get started again</p>
            <p>• Your Google authentication and API settings are preserved</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-4">Calculating portfolio...</p>
      </div>
    )
  }

  if (!portfolio || portfolio.positions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">All Positions Closed</h3>
        <p className="text-gray-600 dark:text-gray-400">
          You have transaction history but no current positions.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Portfolio Summary
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-blue-100">Total Invested</p>
            <p className="text-2xl font-bold">{formatCurrency(portfolio.totalInvested)}</p>
          </div>
          <div>
            <p className="text-blue-100">Current Value</p>
            <p className="text-2xl font-bold">{formatCurrency(portfolio.totalCurrentValue)}</p>
          </div>
          <div>
            <p className="text-blue-100">Realized P&L</p>
            <p className={`text-2xl font-bold ${
              portfolio.totalRealizedGainLoss >= 0 ? 'text-green-300' : 'text-red-300'
            }`}>
              {formatCurrency(portfolio.totalRealizedGainLoss)}
            </p>
          </div>
          <div>
            <p className="text-blue-100">Unrealized P&L</p>
            <p className={`text-2xl font-bold ${
              portfolio.totalUnrealizedGainLoss >= 0 ? 'text-green-300' : 'text-red-300'
            }`}>
              {formatCurrency(portfolio.totalUnrealizedGainLoss)}
            </p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex justify-between items-center">
            <span className="text-lg">Total P&L:</span>
            <span className={`text-2xl font-bold ${
              portfolio.totalGainLoss >= 0 ? 'text-green-300' : 'text-red-300'
            }`}>
              {formatCurrency(portfolio.totalGainLoss)} 
              ({formatPercentage(portfolio.totalGainLoss, portfolio.totalInvested)})
            </span>
          </div>
        </div>
      </div>

      {/* Positions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Current Positions</h3>
        {portfolio.positions.map((position) => (
          <div key={position.symbol} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-300 font-bold text-sm sm:text-lg">
                      {position.symbol.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{position.symbol}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {position.totalShares.toFixed(5).replace(/\.?0+$/, '')} shares @ {formatCurrency(position.averageCostPerShare)} avg
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedPosition(
                    expandedPosition === position.symbol ? null : position.symbol
                  )}
                  className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-target"
                  aria-label={`${expandedPosition === position.symbol ? 'Collapse' : 'Expand'} ${position.symbol} details`}
                >
                  {expandedPosition === position.symbol ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Invested</p>
                  <p className="font-semibold text-sm sm:text-lg text-gray-900 dark:text-white">
                    {formatCurrency(position.totalInvested)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Current Value</p>
                  <p className="font-semibold text-sm sm:text-lg text-gray-900 dark:text-white">
                    {formatCurrency(position.currentValue || 0)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Realized P&L</p>
                  <p className={`font-semibold text-sm sm:text-lg ${getGainLossColor(position.realizedGainLoss)}`}>
                    {formatCurrency(position.realizedGainLoss)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Unrealized P&L</p>
                  <p className={`font-semibold text-sm sm:text-lg ${getGainLossColor(position.unrealizedGainLoss || 0)}`}>
                    {formatCurrency(position.unrealizedGainLoss || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            {expandedPosition === position.symbol && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="p-4 sm:p-6">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-4">Transaction History</h5>
                  <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                    {position.transactions
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {transaction.type === 'BUY' ? (
                              <Plus className="h-4 w-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <Minus className="h-4 w-4 text-red-600 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                                {transaction.type} {transaction.quantity.toFixed(5).replace(/\.?0+$/, '')} shares @ {formatCurrency(transaction.pricePerShare)}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                {new Date(transaction.date).toLocaleDateString()} • Total: {formatCurrency(transaction.totalAmount)}
                              </p>
                              {transaction.notes && (
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 italic mt-1 truncate">{transaction.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => onEditTransaction(transaction)}
                              className="p-2 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors touch-target"
                              title="Edit transaction"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDeleteTransaction(transaction.id)}
                              className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors touch-target"
                              title="Delete transaction"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
