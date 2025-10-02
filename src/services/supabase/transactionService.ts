import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import type { Transaction, Position } from '@/types/transactions'
import { TransactionCalculator } from '@/types/transactions'

type TransactionRow = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

/**
 * Supabase Transaction Service
 * Handles all transaction-related database operations with cloud storage
 */
export class SupabaseTransactionService {
  private static supabase = createClient()

  /**
   * Check if Supabase is available
   */
  static isAvailable(): boolean {
    return this.supabase !== null
  }

  /**
   * Convert database row to Transaction interface
   */
  private static toTransaction(row: TransactionRow, tagIds: string[] = []): Transaction {
    const quantity = Number(row.shares)
    const pricePerShare = Number(row.price)
    return {
      id: row.id,
      symbol: row.symbol,
      type: row.type === 'buy' ? 'BUY' : 'SELL',
      quantity,
      pricePerShare,
      totalAmount: quantity * pricePerShare,
      date: row.date,
      notes: row.notes || undefined,
      tags: tagIds,
    }
  }

  /**
   * Get current user ID
   */
  private static async getUserId(): Promise<string | null> {
    if (!this.isAvailable() || !this.supabase) return null
    
    const { data: { user } } = await this.supabase.auth.getUser()
    return user?.id || null
  }

  /**
   * Get all transactions for the current user
   */
  static async getTransactions(): Promise<Transaction[]> {
    try {
      if (!this.isAvailable() || !this.supabase) return []
      
      const { data: transactions, error: txError } = await this.supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })

      if (txError) {
        console.error('Error fetching transactions:', txError)
        return []
      }

      if (!transactions || transactions.length === 0) return []

      // Get all tag relationships
      const transactionIds = transactions.map((t) => t.id)
      const { data: tagRelations } = await this.supabase
        .from('transaction_tags')
        .select('transaction_id, tag_id')
        .in('transaction_id', transactionIds)

      // Map tag IDs to transactions
      const tagMap = new Map<string, string[]>()
      tagRelations?.forEach((rel) => {
        const existing = tagMap.get(rel.transaction_id) || []
        tagMap.set(rel.transaction_id, [...existing, rel.tag_id])
      })

      return transactions.map((tx) =>
        this.toTransaction(tx, tagMap.get(tx.id) || [])
      )
    } catch (error) {
      console.error('Error in getTransactions:', error)
      return []
    }
  }

  /**
   * Get transactions for a specific symbol
   */
  static async getTransactionsBySymbol(symbol: string): Promise<Transaction[]> {
    try {
      if (!this.isAvailable() || !this.supabase) return []
      
      const { data: transactions, error: txError } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .order('date', { ascending: false })

      if (txError) {
        console.error('Error fetching transactions by symbol:', txError)
        return []
      }

      if (!transactions || transactions.length === 0) return []

      // Get tag relationships
      const transactionIds = transactions.map((t) => t.id)
      const { data: tagRelations } = await this.supabase
        .from('transaction_tags')
        .select('transaction_id, tag_id')
        .in('transaction_id', transactionIds)

      const tagMap = new Map<string, string[]>()
      tagRelations?.forEach((rel) => {
        const existing = tagMap.get(rel.transaction_id) || []
        tagMap.set(rel.transaction_id, [...existing, rel.tag_id])
      })

      return transactions.map((tx) =>
        this.toTransaction(tx, tagMap.get(tx.id) || [])
      )
    } catch (error) {
      console.error('Error in getTransactionsBySymbol:', error)
      return []
    }
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(
    transaction: Omit<Transaction, 'id'>
  ): Promise<Transaction | null> {
    try {
      if (!this.isAvailable() || !this.supabase) return null
      
      const userId = await this.getUserId()
      if (!userId) {
        console.error('User not authenticated')
        return null
      }

      const txData: TransactionInsert = {
        user_id: userId,
        symbol: transaction.symbol.toUpperCase(),
        type: transaction.type === 'BUY' ? 'buy' : 'sell',
        shares: transaction.quantity,
        price: transaction.pricePerShare,
        date: transaction.date,
        notes: transaction.notes || null,
      }

      const { data: createdTx, error: txError } = await this.supabase
        .from('transactions')
        .insert(txData)
        .select()
        .single()

      if (txError) {
        console.error('Error creating transaction:', txError)
        return null
      }

      // Add tags if provided
      if (transaction.tags && transaction.tags.length > 0) {
        await this.updateTransactionTags(createdTx.id, transaction.tags)
      }

      return this.toTransaction(createdTx, transaction.tags || [])
    } catch (error) {
      console.error('Error in createTransaction:', error)
      return null
    }
  }

  /**
   * Update an existing transaction
   */
  static async updateTransaction(
    id: string,
    updates: Partial<Omit<Transaction, 'id'>>
  ): Promise<Transaction | null> {
    try {
      if (!this.isAvailable() || !this.supabase) return null
      
      const txUpdate: TransactionUpdate = {}
      if (updates.symbol !== undefined) txUpdate.symbol = updates.symbol.toUpperCase()
      if (updates.type !== undefined) txUpdate.type = updates.type === 'BUY' ? 'buy' : 'sell'
      if (updates.quantity !== undefined) txUpdate.shares = updates.quantity
      if (updates.pricePerShare !== undefined) txUpdate.price = updates.pricePerShare
      if (updates.date !== undefined) txUpdate.date = updates.date
      if (updates.notes !== undefined) txUpdate.notes = updates.notes || null

      const { data: updatedTx, error: txError } = await this.supabase
        .from('transactions')
        .update(txUpdate)
        .eq('id', id)
        .select()
        .single()

      if (txError) {
        console.error('Error updating transaction:', txError)
        return null
      }

      // Update tags if provided
      if (updates.tags !== undefined) {
        await this.updateTransactionTags(id, updates.tags)
      }

      return this.toTransaction(updatedTx, updates.tags || [])
    } catch (error) {
      console.error('Error in updateTransaction:', error)
      return null
    }
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(id: string): Promise<boolean> {
    try {
      if (!this.isAvailable() || !this.supabase) return false
      
      // Tags will be automatically deleted via CASCADE
      const { error } = await this.supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting transaction:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteTransaction:', error)
      return false
    }
  }

  /**
   * Update transaction tags
   */
  private static async updateTransactionTags(
    transactionId: string,
    tagIds: string[]
  ): Promise<void> {
    try {
      if (!this.isAvailable() || !this.supabase) return
      
      // Delete existing tags
      await this.supabase
        .from('transaction_tags')
        .delete()
        .eq('transaction_id', transactionId)

      // Insert new tags
      if (tagIds.length > 0) {
        const tagInserts = tagIds.map((tagId) => ({
          transaction_id: transactionId,
          tag_id: tagId,
        }))

        await this.supabase.from('transaction_tags').insert(tagInserts)
      }
    } catch (error) {
      console.error('Error updating transaction tags:', error)
    }
  }

  /**
   * Get portfolio positions (aggregated transactions)
   */
  static async getPortfolioPositions(): Promise<Position[]> {
    try {
      const transactions = await this.getTransactions()
      return this.calculatePositions(transactions)
    } catch (error) {
      console.error('Error in getPortfolioPositions:', error)
      return []
    }
  }

  /**
   * Calculate positions from transactions
   */
  private static calculatePositions(transactions: Transaction[]): Position[] {
    const symbolMap = new Map<string, Transaction[]>()

    // Group transactions by symbol
    transactions.forEach((tx) => {
      const existing = symbolMap.get(tx.symbol) || []
      symbolMap.set(tx.symbol, [...existing, tx])
    })

    // Calculate position for each symbol using the TransactionCalculator
    const positions: Position[] = []
    symbolMap.forEach((txs) => {
      const position = TransactionCalculator.calculatePosition(txs)
      if (position && position.totalShares > 0) {
        positions.push(position)
      }
    })

    return positions
  }

  /**
   * Subscribe to real-time transaction changes
   */
  static subscribeToTransactions(callback: (transactions: Transaction[]) => void) {
    if (!this.isAvailable() || !this.supabase) return () => {}
    
    const channel = this.supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        async () => {
          // Reload all transactions when any change occurs
          const transactions = await this.getTransactions()
          callback(transactions)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }
}
