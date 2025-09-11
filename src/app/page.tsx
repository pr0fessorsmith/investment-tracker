'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { PlusCircle, TrendingUp, DollarSign, BarChart3, LogOut, History, Edit } from 'lucide-react'
import TransactionForm from '@/components/TransactionForm'
import TransactionPortfolio from '@/components/TransactionPortfolio'
import Charts from '@/components/Charts'
import { Transaction } from '@/types/transactions'
import { financeService } from '@/services/financeService'

export default function Home() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('portfolio')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

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

  const handleTestConnection = async () => {
    const result = await financeService.testConnection()
    alert(`${result.success ? '✅' : '❌'} ${result.message}`)
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <TrendingUp className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">Investment Tracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img
                  className="h-8 w-8 rounded-full"
                  src={session.user?.image || ''}
                  alt={session.user?.name || 'User'}
                />
                <span className="text-sm font-medium text-gray-700">
                  {session.user?.name}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'portfolio'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Portfolio</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <PlusCircle className="h-4 w-4" />
                <span>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <History className="h-4 w-4" />
                <span>Transaction History</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'charts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </div>
            </button>
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
              onTestConnection={handleTestConnection}
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
                                "{transaction.notes}"
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
    </div>
  )
}
