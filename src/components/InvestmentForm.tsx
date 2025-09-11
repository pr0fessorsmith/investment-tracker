'use client'

import { useState } from 'react'
import { PlusCircle, AlertCircle } from 'lucide-react'
import { financeService } from '@/services/financeService'
import { Investment } from '@/types/investment'

export default function InvestmentForm() {
  const [symbol, setSymbol] = useState('')
  const [shares, setShares] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsValidating(true)
    
    try {
      const symbolUpper = symbol.toUpperCase()
      
      // Validate symbol exists
      const isValidSymbol = await financeService.validateSymbol(symbolUpper)
      if (!isValidSymbol) {
        setError(`Stock symbol "${symbolUpper}" not found. Please check the symbol and try again.`)
        setIsValidating(false)
        return
      }

      const investment: Investment = {
        id: Date.now().toString(),
        symbol: symbolUpper,
        shares: parseFloat(shares),
        purchasePrice: parseFloat(purchasePrice),
        purchaseDate,
      }

      // Get historical price for validation (optional - show user comparison)
      const historicalPrice = await financeService.getHistoricalPrice(symbolUpper, purchaseDate)
      
      // Save to localStorage for now (in production, this would be saved to a database)
      const existingInvestments = JSON.parse(localStorage.getItem('investments') || '[]')
      const updatedInvestments = [...existingInvestments, investment]
      localStorage.setItem('investments', JSON.stringify(updatedInvestments))

      // Reset form
      setSymbol('')
      setShares('')
      setPurchasePrice('')
      setPurchaseDate('')

      // Show success message with market comparison
      let successMessage = 'Investment added successfully!'
      if (historicalPrice && Math.abs(historicalPrice - parseFloat(purchasePrice)) > 0.01) {
        const diff = parseFloat(purchasePrice) - historicalPrice
        const diffPercent = (diff / historicalPrice) * 100
        successMessage += ` Market price on ${purchaseDate} was $${historicalPrice.toFixed(2)} (${diffPercent > 0 ? '+' : ''}${diffPercent.toFixed(1)}% vs your price).`
      }
      
      setSuccess(successMessage)
      setTimeout(() => setSuccess(''), 5000)
      
    } catch (error) {
      console.error('Error adding investment:', error)
      setError('Failed to add investment. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
            Add New Investment
          </h3>

          {error && (
            <div className="mb-4 flex items-center p-3 text-sm text-red-700 bg-red-100 rounded-lg">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-lg">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Symbol
                </label>
                <input
                  type="text"
                  name="symbol"
                  id="symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g., AAPL, GOOGL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="shares" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Shares
                </label>
                <input
                  type="number"
                  name="shares"
                  id="shares"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  placeholder="0.00000"
                  step="0.00001"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Price ($)
                </label>
                <input
                  type="number"
                  name="purchasePrice"
                  id="purchasePrice"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  id="purchaseDate"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isValidating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                {isValidating ? 'Validating & Adding...' : 'Add Investment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
