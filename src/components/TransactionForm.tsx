'use client'

import React, { useState, useEffect } from 'react'
import { PlusCircle, DollarSign, Calendar, Hash, MessageSquare, TrendingUp, TrendingDown } from 'lucide-react'
import { financeService } from '../services/financeService'
import { Transaction, TransactionCalculator } from '../types/transactions'

interface TransactionFormProps {
  onTransactionAdded: (transaction: Transaction) => void
  onTransactionUpdated?: (transaction: Transaction) => void
  existingTransactions: Transaction[]
  editingTransaction?: Transaction | null
  onCancelEdit?: () => void
}

export default function TransactionForm({ onTransactionAdded, onTransactionUpdated, existingTransactions, editingTransaction, onCancelEdit }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    symbol: '',
    type: 'BUY' as 'BUY' | 'SELL',
    quantity: '',
    pricePerShare: '',
    date: new Date().toISOString().split('T')[0],
    fees: '',
    notes: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [availableShares, setAvailableShares] = useState(0)
  const [validation, setValidation] = useState({ valid: true, message: '' })
  const [isEditMode, setIsEditMode] = useState(false)

  // Load editing transaction data
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        symbol: editingTransaction.symbol,
        type: editingTransaction.type,
        quantity: editingTransaction.quantity.toString(),
        pricePerShare: editingTransaction.pricePerShare.toString(),
        date: editingTransaction.date,
        fees: editingTransaction.fees?.toString() || '',
        notes: editingTransaction.notes || ''
      })
      setIsEditMode(true)
    } else {
      setIsEditMode(false)
    }
  }, [editingTransaction])

  // Calculate available shares for selling when symbol or type changes
  useEffect(() => {
    if (formData.symbol && formData.type === 'SELL') {
      // For edit mode, exclude the current transaction from available shares calculation
      const transactionsToCheck = isEditMode && editingTransaction
        ? existingTransactions.filter(t => t.id !== editingTransaction.id && t.symbol.toLowerCase() === formData.symbol.toLowerCase())
        : existingTransactions.filter(t => t.symbol.toLowerCase() === formData.symbol.toLowerCase())
      
      const position = TransactionCalculator.calculatePosition(transactionsToCheck)
      setAvailableShares(position?.totalShares || 0)
    } else {
      setAvailableShares(0)
    }
  }, [formData.symbol, formData.type, existingTransactions, isEditMode, editingTransaction])

  // Fetch current market price when symbol changes
  useEffect(() => {
    if (formData.symbol && formData.symbol.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          setIsLoading(true)
          const price = await financeService.getCurrentPrice(formData.symbol.toUpperCase())
          if (price) {
            setCurrentPrice(price.currentPrice)
            // Auto-fill price for BUY transactions if empty
            if (formData.type === 'BUY' && !formData.pricePerShare) {
              setFormData(prev => ({ ...prev, pricePerShare: price.currentPrice.toString() }))
            }
          }
        } catch (error) {
          console.error('Error fetching price:', error)
        } finally {
          setIsLoading(false)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [formData.symbol, formData.type, formData.pricePerShare])

  // Validate sell transaction
  useEffect(() => {
    if (formData.type === 'SELL' && formData.quantity && formData.symbol) {
      const quantity = parseFloat(formData.quantity)
      // For edit mode, exclude the current transaction from validation
      const transactionsToCheck = isEditMode && editingTransaction
        ? existingTransactions.filter(t => t.id !== editingTransaction.id && t.symbol.toLowerCase() === formData.symbol.toLowerCase())
        : existingTransactions.filter(t => t.symbol.toLowerCase() === formData.symbol.toLowerCase())
      
      const validationResult = TransactionCalculator.validateSellTransaction(formData.symbol, quantity, transactionsToCheck)
      setValidation(validationResult)
    } else {
      setValidation({ valid: true, message: '' })
    }
  }, [formData.type, formData.quantity, formData.symbol, existingTransactions, isEditMode, editingTransaction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validation.valid) {
      alert(validation.message)
      return
    }

    const quantity = parseFloat(formData.quantity)
    const pricePerShare = parseFloat(formData.pricePerShare)
    const fees = parseFloat(formData.fees) || 0

    if (isNaN(quantity) || isNaN(pricePerShare) || quantity <= 0 || pricePerShare <= 0) {
      alert('Please enter valid positive numbers for quantity and price')
      return
    }

    // Round quantity to 5 decimal places to handle floating-point precision
    const roundedQuantity = Math.round(quantity * 100000) / 100000

    const transaction: Transaction = {
      id: isEditMode && editingTransaction ? editingTransaction.id : Date.now().toString(),
      symbol: formData.symbol.toUpperCase(),
      type: formData.type,
      quantity: roundedQuantity,
      pricePerShare,
      date: formData.date,
      totalAmount: (roundedQuantity * pricePerShare) + (formData.type === 'BUY' ? fees : -fees),
      fees: fees > 0 ? fees : undefined,
      notes: formData.notes || undefined
    }

    if (isEditMode && onTransactionUpdated) {
      onTransactionUpdated(transaction)
    } else {
      onTransactionAdded(transaction)
    }

    // Reset form only if not in edit mode
    if (!isEditMode) {
      setFormData({
        symbol: '',
        type: 'BUY',
        quantity: '',
        pricePerShare: '',
        date: new Date().toISOString().split('T')[0],
        fees: '',
        notes: ''
      })
      setCurrentPrice(null)
    }
  }

  const totalAmount = formData.quantity && formData.pricePerShare ? 
    (parseFloat(formData.quantity) * parseFloat(formData.pricePerShare)) + (parseFloat(formData.fees) || 0) : 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <PlusCircle className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
        </div>
        {isEditMode && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'BUY' }))}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              formData.type === 'BUY'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <TrendingUp className="h-4 w-4 inline mr-2" />
            BUY
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'SELL' }))}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              formData.type === 'SELL'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <TrendingDown className="h-4 w-4 inline mr-2" />
            SELL
          </button>
        </div>

        {/* Symbol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Stock Symbol (NYSE)
          </label>
          <input
            type="text"
            placeholder="e.g., AAPL, MSFT, TSLA"
            value={formData.symbol}
            onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
          {currentPrice && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Current Market Price: ${currentPrice.toFixed(2)}
            </p>
          )}
          {formData.type === 'SELL' && formData.symbol && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Available Shares: {availableShares}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Hash className="h-4 w-4 inline mr-1" />
              Quantity (Shares)
            </label>
            <input
              type="number"
              placeholder="100 or 0.25643 (fractional shares)"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="0"
              step="0.00001"
              required
            />
            {!validation.valid && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {validation.message}
              </p>
            )}
          </div>

          {/* Price per Share */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Price per Share ($)
            </label>
            <input
              type="number"
              placeholder="150.00"
              value={formData.pricePerShare}
              onChange={(e) => setFormData(prev => ({ ...prev, pricePerShare: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Transaction Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Fees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Fees ($) - Optional
            </label>
            <input
              type="number"
              placeholder="9.95"
              value={formData.fees}
              onChange={(e) => setFormData(prev => ({ ...prev, fees: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MessageSquare className="h-4 w-4 inline mr-1" />
            Notes (Optional)
          </label>
          <textarea
            placeholder="e.g., Earnings beat expectations, Strong quarterly results..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={3}
          />
        </div>

        {/* Transaction Summary */}
        {totalAmount > 0 && (
          <div className={`p-4 rounded-lg ${
            formData.type === 'BUY' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <h3 className={`font-semibold ${
              formData.type === 'BUY' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              Transaction Summary
            </h3>
            <p className={`text-sm ${
              formData.type === 'BUY' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
            }`}>
              {formData.type} {formData.quantity} shares of {formData.symbol} at ${formData.pricePerShare}/share
            </p>
            <p className={`font-bold ${
              formData.type === 'BUY' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              Total: ${totalAmount.toFixed(2)} {formData.fees && `(includes $${formData.fees} fees)`}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !validation.valid}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
            formData.type === 'BUY'
              ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400'
              : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400'
          }`}
        >
          {isLoading ? 'Loading...' : `${isEditMode ? 'Update' : formData.type} ${formData.symbol || 'Transaction'}`}
        </button>
      </form>
    </div>
  )
}
