'use client'

import React, { useState, useEffect } from 'react'
import { PlusCircle, DollarSign, Calendar, Hash, MessageSquare, TrendingUp, TrendingDown, Tag as TagIcon, X } from 'lucide-react'
import { financeService } from '../services/financeService'
import { UnifiedTagService } from '../services/unifiedTagService'
import { TransactionService } from '../services/transactionService'
import { Transaction, TransactionCalculator, Tag } from '../types/transactions'

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
    notes: '',
    tags: [] as string[]
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [availableShares, setAvailableShares] = useState(0)
  const [validation, setValidation] = useState({ valid: true, message: '' })
  const [isEditMode, setIsEditMode] = useState(false)
  
  // Tag-related state
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [tagInput, setTagInput] = useState('')
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [filteredTags, setFilteredTags] = useState<Tag[]>([])

  // Load available tags
  useEffect(() => {
    const loadTags = async () => {
      const tags = await UnifiedTagService.getTags()
      setAvailableTags(tags)
    }
    loadTags()
  }, [])

  // Filter tags based on input
  useEffect(() => {
    if (tagInput.trim()) {
      const filtered = availableTags.filter(tag => 
        tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
        !formData.tags.includes(tag.id)
      )
      setFilteredTags(filtered)
      setShowTagSuggestions(true)
    } else {
      setFilteredTags([])
      setShowTagSuggestions(false)
    }
  }, [tagInput, availableTags, formData.tags])

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
        notes: editingTransaction.notes || '',
        tags: editingTransaction.tags || []
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

    const transactionData = {
      symbol: formData.symbol.toUpperCase(),
      type: formData.type,
      quantity: roundedQuantity,
      pricePerShare,
      date: formData.date,
      totalAmount: (roundedQuantity * pricePerShare) + (formData.type === 'BUY' ? fees : -fees),
      fees: fees > 0 ? fees : undefined,
      notes: formData.notes || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined
    }

    if (isEditMode && editingTransaction && onTransactionUpdated) {
      // Update existing transaction
      const updated = await TransactionService.updateTransaction(editingTransaction.id, transactionData)
      if (updated) {
        onTransactionUpdated(updated)
      }
    } else {
      // Create new transaction
      const created = await TransactionService.createTransaction(transactionData)
      if (created) {
        onTransactionAdded(created)
      }
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
        notes: '',
        tags: []
      })
      setCurrentPrice(null)
    }
  }

  const totalAmount = formData.quantity && formData.pricePerShare ? 
    (parseFloat(formData.quantity) * parseFloat(formData.pricePerShare)) + (parseFloat(formData.fees) || 0) : 0

  // Tag management functions
  const addTag = (tagId: string) => {
    if (!formData.tags.includes(tagId)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagId] }))
    }
    setTagInput('')
    setShowTagSuggestions(false)
  }

  const removeTag = (tagId: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(id => id !== tagId) }))
  }

  const createAndAddTag = async () => {
    if (tagInput.trim() && !(await UnifiedTagService.tagExists(tagInput.trim()))) {
      const newTag = await UnifiedTagService.createTag(tagInput.trim())
      const tags = await UnifiedTagService.getTags()
      setAvailableTags(tags) // Refresh available tags
      if (newTag) {
        addTag(newTag.id)
      }
    }
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredTags.length > 0) {
        addTag(filteredTags[0].id)
      } else if (tagInput.trim()) {
        createAndAddTag()
      }
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false)
      setTagInput('')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
        </div>
        {isEditMode && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-3 py-2 sm:px-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors touch-target"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Transaction Type Toggle */}
        <div className="grid grid-cols-2 gap-2 mb-4 sm:mb-6">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'BUY' }))}
            className={`py-3 sm:py-4 px-4 rounded-lg font-semibold transition-colors touch-target ${
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
            className={`py-3 sm:py-4 px-4 rounded-lg font-semibold transition-colors touch-target ${
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
            className="w-full p-3 sm:p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Hash className="h-4 w-4 inline mr-1" />
              Quantity (Shares)
            </label>
            <input
              type="number"
              placeholder="100 or 0.25643"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              className="w-full p-3 sm:p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
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
              className="w-full p-3 sm:p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              className="w-full p-3 sm:p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
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
              className="w-full p-3 sm:p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
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
            className="w-full p-3 sm:p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base resize-y"
            rows={3}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <TagIcon className="h-4 w-4 inline mr-1" />
            Tags (Optional)
          </label>
          
          {/* Selected Tags */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map(tagId => {
                const tag = availableTags.find(t => t.id === tagId)
                return tag ? (
                  <span
                    key={tagId}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => removeTag(tagId)}
                      className="ml-1 hover:bg-black/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : null
              })}
            </div>
          )}

          {/* Tag Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Add tags (broker, strategy, etc.)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              onFocus={() => tagInput && setShowTagSuggestions(true)}
              onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
              className="w-full p-3 sm:p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
            />
            
            {/* Tag Suggestions */}
            {showTagSuggestions && filteredTags.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => addTag(tag.id)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-gray-900 dark:text-white">{tag.name}</span>
                    {tag.category && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                        {tag.category}
                      </span>
                    )}
                  </button>
                ))}
                {tagInput.trim() && (
                  <button
                    type="button"
                    onClick={createAndAddTag}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-200 dark:border-gray-600 text-blue-600 dark:text-blue-400"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Create &ldquo;{tagInput.trim()}&rdquo;
                  </button>
                )}
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Use tags to organize your investments by broker, strategy, sector, etc.
          </p>
        </div>

        {/* Transaction Summary */}
        {totalAmount > 0 && (
          <div className={`p-4 rounded-lg ${
            formData.type === 'BUY' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <h3 className={`font-semibold text-base sm:text-lg ${
              formData.type === 'BUY' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              Transaction Summary
            </h3>
            <p className={`text-sm sm:text-base ${
              formData.type === 'BUY' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
            }`}>
              {formData.type} {formData.quantity} shares of {formData.symbol} at ${formData.pricePerShare}/share
            </p>
            <p className={`font-bold text-lg sm:text-xl ${
              formData.type === 'BUY' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              Total: ${totalAmount.toFixed(2)} {formData.fees && `(includes $${formData.fees} fees)`}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !validation.valid}
          className={`w-full py-4 px-4 rounded-lg font-semibold text-white text-base sm:text-lg transition-colors touch-target ${
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
