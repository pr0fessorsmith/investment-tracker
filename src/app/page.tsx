'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { PlusCircle, TrendingUp, DollarSign, BarChart3, LogOut, History, Edit, Tag as TagIcon } from 'lucide-react'
import TransactionForm from '@/components/TransactionForm'
import TransactionPortfolio from '@/components/TransactionPortfolio'
import Charts from '@/components/Charts'
import TagManager from '@/components/TagManager'
import { Transaction } from '@/types/transactions'
import { financeService } from '@/services/financeService'

export default function Home() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('portfolio')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showTagManager, setShowTagManager] = useState(false)

  // Load transactions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('investment-transactions')
      console.log('Loading transactions from localStorage:', saved)
      
      if (saved) {
        const parsed = JSON.parse(saved)
        console.log('Parsed transactions:', parsed)
        setTransactions(parsed)
      } else {
        console.log('No saved transactions found')
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }, [])

  // Save transactions to localStorage
  useEffect(() => {
    if (transactions.length > 0) {
      console.log('Saving transactions to localStorage:', transactions)
      localStorage.setItem('investment-transactions', JSON.stringify(transactions))
      console.log('Saved successfully')
    }
  }, [transactions])

  const handleTransactionAdded = (transaction: Transaction) => {
    console.log('Adding transaction:', transaction)
    const newTransactions = [...transactions, transaction]
    setTransactions(newTransactions)
    
    // Force save immediately
    try {
      localStorage.setItem('investment-transactions', JSON.stringify(newTransactions))
      console.log('Force saved transactions:', newTransactions)
    } catch (error) {
      console.error('Error force saving:', error)
    }
    
    setActiveTab('portfolio') // Switch to portfolio after adding
  }

  const handleTransactionUpdated = (updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t))
    setEditingTransaction(null)
    setActiveTab('portfolio') // Switch to portfolio after editing
  }

  const handleDeleteTransaction = (transactionId: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== transactionId))
    }
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setActiveTab('transactions') // Switch to transaction form for editing
  }

  const handleCancelEdit = () => {
    setEditingTransaction(null)
  }

  // Test localStorage functionality
  const handleTestLocalStorage = () => {
    try {
      // Test write
      const testData = { test: 'value', timestamp: Date.now() }
      localStorage.setItem('investment-test', JSON.stringify(testData))
      
      // Test read
      const retrieved = localStorage.getItem('investment-test')
      const parsed = JSON.parse(retrieved || '{}')
      
      // Test current transactions
      const currentTransactions = localStorage.getItem('investment-transactions')
      
      alert(
        `LocalStorage Test:\n` +
        `✅ Write/Read: ${parsed.test === 'value' ? 'Working' : 'Failed'}\n` +
        `📊 Current Transactions: ${currentTransactions ? JSON.parse(currentTransactions).length : 0} found\n` +
        `💾 Raw Data: ${currentTransactions ? 'Present' : 'Empty'}\n` +
        `🔄 In Memory: ${transactions.length} transactions`
      )
      
      // Cleanup test
      localStorage.removeItem('investment-test')
    } catch (error) {
      alert(`LocalStorage Error: ${error}`)
    }
  }

  // Emergency data recovery function
  const handleDataRecovery = () => {
    const confirmed = confirm(
      'This will add some sample transactions to help you get started again. ' +
      'Your original data may be recoverable from browser history. Continue?'
    )
    
    if (confirmed) {
      // Create some sample transactions based on common stocks
      const sampleTransactions: Transaction[] = [
        {
          id: Date.now().toString() + '_1',
          symbol: 'AAPL',
          type: 'BUY',
          quantity: 10,
          pricePerShare: 150.00,
          date: '2024-01-15',
          totalAmount: 1500.00,
          notes: 'Sample Apple transaction'
        },
        {
          id: Date.now().toString() + '_2',
          symbol: 'MSFT', 
          type: 'BUY',
          quantity: 5,
          pricePerShare: 300.00,
          date: '2024-02-01',
          totalAmount: 1500.00,
          notes: 'Sample Microsoft transaction'
        }
      ]
      
      setTransactions(sampleTransactions)
      alert('Sample transactions added! You can now edit or delete these and add your real data.')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-primary-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Investment Tracker
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Track your investments with real-time data and analytics
            </p>
          </div>
          <div>
            <button
              onClick={() => signIn('google')}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-Optimized Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Investment Tracker</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Image
                  className="h-6 w-6 sm:h-8 sm:w-8 rounded-full"
                  src={session.user?.image || '/default-avatar.png'}
                  alt={session.user?.name || 'User'}
                  width={32}
                  height={32}
                />
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {session.user?.name}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile-Optimized Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide">
            {[
              { id: 'portfolio', label: 'Portfolio', icon: DollarSign, emoji: '💼' },
              { id: 'transactions', label: editingTransaction ? 'Edit' : 'Add', icon: PlusCircle, emoji: '➕' },
              { id: 'history', label: 'History', icon: History, emoji: '📋' },
              { id: 'charts', label: 'Analytics', icon: BarChart3, emoji: '📊' },
              { id: 'tags', label: 'Tags', icon: TagIcon, emoji: '🏷️', action: () => setShowTagManager(true) }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.action) {
                      tab.action()
                    } else {
                      setActiveTab(tab.id)
                    }
                  }}
                  className={`flex-1 min-w-0 px-3 py-4 text-center border-b-2 transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {/* Mobile: Icon + Label */}
                  <div className="flex flex-col items-center space-y-1">
                    <div className="flex items-center justify-center">
                      <span className="text-lg sm:hidden">{tab.emoji}</span>
                      <Icon className="h-4 w-4 hidden sm:block" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'portfolio' && (
            <TransactionPortfolio 
              transactions={transactions}
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={handleEditTransaction}
              onDataRecovery={handleDataRecovery}
              onTestLocalStorage={handleTestLocalStorage}
            />
          )}
          {activeTab === 'transactions' && (
            <TransactionForm 
              onTransactionAdded={handleTransactionAdded}
              onTransactionUpdated={handleTransactionUpdated}
              existingTransactions={transactions}
              editingTransaction={editingTransaction}
              onCancelEdit={handleCancelEdit}
            />
          )}
          {activeTab === 'history' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">All Transactions</h2>
              {transactions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No transactions yet. Add your first transaction!</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((transaction) => (
                      <div
                        key={transaction.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          transaction.type === 'BUY' 
                            ? 'bg-green-50 border-green-500 dark:bg-green-900/20' 
                            : 'bg-red-50 border-red-500 dark:bg-red-900/20'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {transaction.type} {transaction.quantity.toFixed(5).replace(/\.?0+$/, '')} shares of {transaction.symbol}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              ${transaction.pricePerShare}/share • Total: ${transaction.totalAmount.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                            {transaction.notes && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 italic mt-1">
                                &quot;{transaction.notes}&quot;
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditTransaction(transaction)}
                              className="text-blue-400 hover:text-blue-600 p-2"
                              title="Edit transaction"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              className="text-red-400 hover:text-red-600 p-2"
                              title="Delete transaction"
                            >
                              <LogOut className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'charts' && <Charts transactions={transactions} />}
        </div>
      </main>

      {/* Tag Manager Modal */}
      <TagManager 
        isOpen={showTagManager}
        onClose={() => setShowTagManager(false)}
        onTagsUpdated={() => {
          // Refresh any components that use tags
          // This could trigger a re-render of components that display tags
        }}
      />
    </div>
  )
}
