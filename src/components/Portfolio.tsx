'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Target, Edit2, Trash2, Check, X, RefreshCw, Clock, AlertCircle } from 'lucide-react'
import { financeService } from '@/services/financeService'
import { Investment, PortfolioSummary } from '@/types/investment'

export default function Portfolio() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Investment | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadInvestments()
  }, [])

  const loadInvestments = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Load from localStorage
      const storedInvestments = JSON.parse(localStorage.getItem('investments') || '[]')
      
      if (storedInvestments.length === 0) {
        setInvestments([])
        setLoading(false)
        return
      }

      // Fetch current and historical prices for each investment
      const investmentsWithPrices = await Promise.all(
        storedInvestments.map(async (investment: Investment) => {
          try {
            // Get current price
            const currentPriceData = await financeService.getCurrentPrice(investment.symbol)
            
            // Get historical price for the purchase date
            const historicalPrice = await financeService.getHistoricalPrice(
              investment.symbol, 
              investment.purchaseDate
            )
            
            const enhancedInvestment: Investment = {
              ...investment,
              currentPrice: currentPriceData?.currentPrice || investment.purchasePrice,
              historicalPrice: historicalPrice || investment.purchasePrice,
              lastUpdated: new Date().toISOString()
            }

            // Calculate different types of gains/losses
            if (historicalPrice) {
              // Real gain/loss: difference between user's purchase price and market price on that day
              const marketValueOnPurchase = investment.shares * historicalPrice
              const userPaidValue = investment.shares * investment.purchasePrice
              enhancedInvestment.realizedGainLoss = marketValueOnPurchase - userPaidValue

              // Unrealized gain/loss: from historical market price to current price
              if (currentPriceData) {
                const currentMarketValue = investment.shares * currentPriceData.currentPrice
                enhancedInvestment.unrealizedGainLoss = currentMarketValue - marketValueOnPurchase
                
                // Total gain/loss: from user's purchase to current
                enhancedInvestment.totalGainLoss = currentMarketValue - userPaidValue
              }
            }

            return enhancedInvestment
          } catch (error) {
            console.error(`Error fetching data for ${investment.symbol}:`, error)
            return investment
          }
        })
      )
      
      setInvestments(investmentsWithPrices)
      setLastUpdated(new Date().toLocaleString())
      
      // Save updated data to localStorage
      localStorage.setItem('investments', JSON.stringify(investmentsWithPrices))
      
    } catch (error) {
      console.error('Error loading investments:', error)
      setError('Failed to load investment data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const refreshPrices = async () => {
    setUpdating(true)
    await loadInvestments()
    setUpdating(false)
  }

  const testAPIConnection = async () => {
    console.log('Starting API test...')
    const result = await financeService.testConnection()
    
    let message = `API Test Result:\n${result.message}\n\nAPI Key: ${result.apiKey}`
    
    if (result.details) {
      message += `\n\nTechnical Details:\n${JSON.stringify(result.details, null, 2)}`
    }
    
    console.log('API Test Result:', result)
    alert(message)
  }

  // Delete investment function
  const deleteInvestment = (id: string) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      const updatedInvestments = investments.filter(inv => inv.id !== id)
      setInvestments(updatedInvestments)
      localStorage.setItem('investments', JSON.stringify(updatedInvestments))
    }
  }

  // Start editing function
  const startEditing = (investment: Investment) => {
    setEditingId(investment.id)
    setEditForm({ ...investment })
  }

  // Cancel editing function
  const cancelEditing = () => {
    setEditingId(null)
    setEditForm(null)
  }

  // Save edited investment function
  const saveEdit = () => {
    if (!editForm) return
    
    const updatedInvestments = investments.map(inv => 
      inv.id === editForm.id ? { ...editForm, currentPrice: inv.currentPrice } : inv
    )
    setInvestments(updatedInvestments)
    localStorage.setItem('investments', JSON.stringify(updatedInvestments))
    setEditingId(null)
    setEditForm(null)
  }

  const totalInvestment = investments.reduce((sum, inv) => sum + (inv.shares * inv.purchasePrice), 0)
  const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.shares * (inv.currentPrice || inv.purchasePrice)), 0)
  const totalGainLoss = totalCurrentValue - totalInvestment
  const totalGainLossPercent = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Investment
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Current Value
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${totalCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {totalGainLoss >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-success-400" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-danger-400" />
                )}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Gain/Loss
                  </dt>
                  <dd className={`text-lg font-medium ${totalGainLoss >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    ${totalGainLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {totalGainLossPercent >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-success-400" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-danger-400" />
                )}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Return %
                  </dt>
                  <dd className={`text-lg font-medium ${totalGainLossPercent >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {totalGainLossPercent.toFixed(2)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investments Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Your Investments
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Real-time market data with historical analysis from your purchase dates.
              </p>
              {lastUpdated && (
                <div className="flex items-center mt-2 text-xs text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Last updated: {lastUpdated}
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={refreshPrices}
                disabled={updating || loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
                {updating ? 'Updating...' : 'Refresh Prices'}
              </button>
              <button
                onClick={testAPIConnection}
                className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Test API
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-3 flex items-center text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
        </div>
        
        {investments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-sm">
              No investments found. Add your first investment to get started.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market Price<br/>
                    <span className="text-xs font-normal">(Purchase Date)</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Skill<br/>
                    <span className="text-xs font-normal">(vs Market)</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market Gain<br/>
                    <span className="text-xs font-normal">(Since Purchase)</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Return<br/>
                    <span className="text-xs font-normal">(Your Gain/Loss)</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {investments.map((investment) => {
                  const isEditing = editingId === investment.id
                  const currentPrice = investment.currentPrice || investment.purchasePrice
                  const historicalPrice = investment.historicalPrice || investment.purchasePrice
                  
                  // Purchase skill: How good was your purchase price vs market price that day
                  const purchaseSkillValue = investment.realizedGainLoss || 0
                  const purchaseSkillPercent = historicalPrice > 0 ? (purchaseSkillValue / (investment.shares * historicalPrice)) * 100 : 0
                  
                  // Market performance: How much the stock moved since purchase date
                  const marketGainValue = investment.unrealizedGainLoss || 0
                  const marketGainPercent = historicalPrice > 0 ? ((currentPrice - historicalPrice) / historicalPrice) * 100 : 0
                  
                  // Total return: Your actual gain/loss from your purchase
                  const totalReturnValue = investment.totalGainLoss || 0
                  const totalReturnPercent = investment.purchasePrice > 0 ? (totalReturnValue / (investment.shares * investment.purchasePrice)) * 100 : 0

                  return (
                    <tr key={investment.id} className={isEditing ? 'bg-blue-50' : ''}>
                      {/* Symbol */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm?.symbol || ''}
                            onChange={(e) => setEditForm(prev => prev ? {...prev, symbol: e.target.value.toUpperCase()} : null)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <div>
                            <div className="font-medium">{investment.symbol}</div>
                            <div className="text-xs text-gray-500">{new Date(investment.purchaseDate).toLocaleDateString()}</div>
                          </div>
                        )}
                      </td>

                      {/* Shares */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.00001"
                            value={editForm?.shares || ''}
                            onChange={(e) => setEditForm(prev => prev ? {...prev, shares: parseFloat(e.target.value)} : null)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          investment.shares.toFixed(5)
                        )}
                      </td>

                      {/* Your Purchase Price */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm?.purchasePrice || ''}
                            onChange={(e) => setEditForm(prev => prev ? {...prev, purchasePrice: parseFloat(e.target.value)} : null)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          `$${investment.purchasePrice.toFixed(2)}`
                        )}
                      </td>

                      {/* Market Price (Purchase Date) */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${historicalPrice.toFixed(2)}
                        {investment.lastUpdated && (
                          <div className="text-xs text-gray-400">Historical</div>
                        )}
                      </td>

                      {/* Current Price */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>${currentPrice.toFixed(2)}</div>
                        {investment.lastUpdated && (
                          <div className="text-xs text-gray-400">Live</div>
                        )}
                      </td>

                      {/* Purchase Skill (vs Market) */}
                      <td className={`px-4 py-4 whitespace-nowrap text-sm ${purchaseSkillPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div>${purchaseSkillValue.toFixed(2)}</div>
                        <div className="text-xs">({purchaseSkillPercent.toFixed(1)}%)</div>
                      </td>

                      {/* Market Gain (Since Purchase) */}
                      <td className={`px-4 py-4 whitespace-nowrap text-sm ${marketGainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div>${marketGainValue.toFixed(2)}</div>
                        <div className="text-xs">({marketGainPercent.toFixed(1)}%)</div>
                      </td>

                      {/* Total Return (Your Gain/Loss) */}
                      <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div>${totalReturnValue.toFixed(2)}</div>
                        <div className="text-xs">({totalReturnPercent.toFixed(1)}%)</div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isEditing ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={saveEdit}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title="Save changes"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Cancel editing"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditing(investment)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Edit investment"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteInvestment(investment.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete investment"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
