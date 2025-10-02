import { createClient } from '@/lib/supabase/client'
import { SupabaseTransactionService } from './supabase/transactionService'
import { Transaction, Position } from '@/types/transactions'

/**
 * Unified Transaction Service
 * Uses Supabase when authenticated, localStorage as fallback
 */
export class TransactionService {
  private static STORAGE_KEY = 'investment-transactions'

  /**
   * Check if user is authenticated
   */
  private static async isAuthenticated(): Promise<boolean> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      return !!user
    } catch {
      return false
    }
  }

  /**
   * Get all transactions
   */
  static async getTransactions(): Promise<Transaction[]> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return await SupabaseTransactionService.getTransactions()
    } else {
      return this.getLocalTransactions()
    }
  }

  /**
   * Get transactions from localStorage
   */
  private static getLocalTransactions(): Transaction[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading transactions from localStorage:', error)
      return []
    }
  }

  /**
   * Save transactions to localStorage
   */
  private static saveLocalTransactions(transactions: Transaction[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions))
    } catch (error) {
      console.error('Error saving transactions to localStorage:', error)
    }
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction | null> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return await SupabaseTransactionService.createTransaction(transaction)
    } else {
      // localStorage fallback
      const newTransaction: Transaction = {
        ...transaction,
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9)
      }
      const existing = this.getLocalTransactions()
      this.saveLocalTransactions([...existing, newTransaction])
      return newTransaction
    }
  }

  /**
   * Update an existing transaction
   */
  static async updateTransaction(
    id: string,
    updates: Partial<Omit<Transaction, 'id'>>
  ): Promise<Transaction | null> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return await SupabaseTransactionService.updateTransaction(id, updates)
    } else {
      // localStorage fallback
      const transactions = this.getLocalTransactions()
      const index = transactions.findIndex(t => t.id === id)
      
      if (index === -1) return null
      
      const updated = { ...transactions[index], ...updates }
      transactions[index] = updated
      this.saveLocalTransactions(transactions)
      return updated
    }
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(id: string): Promise<boolean> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return await SupabaseTransactionService.deleteTransaction(id)
    } else {
      // localStorage fallback
      const transactions = this.getLocalTransactions()
      const filtered = transactions.filter(t => t.id !== id)
      this.saveLocalTransactions(filtered)
      return true
    }
  }

  /**
   * Get portfolio positions
   */
  static async getPortfolioPositions(): Promise<Position[]> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return await SupabaseTransactionService.getPortfolioPositions()
    } else {
      // localStorage fallback - calculate from transactions
      const transactions = this.getLocalTransactions()
      return SupabaseTransactionService['calculatePositions'](transactions)
    }
  }

  /**
   * Subscribe to transaction changes (only works with Supabase)
   */
  static async subscribeToTransactions(
    callback: (transactions: Transaction[]) => void
  ): Promise<(() => void) | null> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return SupabaseTransactionService.subscribeToTransactions(callback)
    }
    
    return null
  }
}
