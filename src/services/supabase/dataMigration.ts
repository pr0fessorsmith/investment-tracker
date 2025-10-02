import { TagService } from '../tagService'
import { SupabaseTagService } from './tagService'
import { SupabaseTransactionService } from './transactionService'
import type { Transaction, Tag } from '@/types/transactions'

/**
 * Data Migration Utility
 * Migrates data from localStorage to Supabase one time
 */
export class DataMigration {
  private static MIGRATION_KEY = 'supabase_migration_completed'

  /**
   * Check if migration has already been completed
   */
  static isMigrationCompleted(): boolean {
    try {
      return localStorage.getItem(this.MIGRATION_KEY) === 'true'
    } catch {
      return false
    }
  }

  /**
   * Mark migration as completed
   */
  static markMigrationCompleted(): void {
    try {
      localStorage.setItem(this.MIGRATION_KEY, 'true')
    } catch (error) {
      console.error('Error marking migration as completed:', error)
    }
  }

  /**
   * Check if there's any localStorage data to migrate
   */
  static hasLocalStorageData(): boolean {
    try {
      const tags = localStorage.getItem('investment-tags')
      const transactions = localStorage.getItem('transactions')
      return !!(tags || transactions)
    } catch {
      return false
    }
  }

  /**
   * Get localStorage transaction data
   */
  private static getLocalStorageTransactions(): Transaction[] {
    try {
      const stored = localStorage.getItem('transactions')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading localStorage transactions:', error)
      return []
    }
  }

  /**
   * Get localStorage tag data
   */
  private static getLocalStorageTags(): Tag[] {
    try {
      return TagService.getTags()
    } catch (error) {
      console.error('Error reading localStorage tags:', error)
      return []
    }
  }

  /**
   * Migrate all data from localStorage to Supabase
   */
  static async migrateToSupabase(): Promise<{
    success: boolean
    message: string
    stats: {
      tagsTotal: number
      tagsMigrated: number
      transactionsTotal: number
      transactionsMigrated: number
    }
  }> {
    const stats = {
      tagsTotal: 0,
      tagsMigrated: 0,
      transactionsTotal: 0,
      transactionsMigrated: 0,
    }

    try {
      // Check if Supabase services are available
      if (!SupabaseTagService.isAvailable() || !SupabaseTransactionService.isAvailable()) {
        console.error('❌ Supabase services not available - check authentication')
        return {
          success: false,
          message: 'Cloud storage not available. Please ensure you are signed in.',
          stats,
        }
      }

      // Check if already migrated
      if (this.isMigrationCompleted()) {
        console.log('⚠️ Migration already completed')
        return {
          success: true,
          message: 'Migration already completed',
          stats,
        }
      }

      // Check if there's data to migrate
      if (!this.hasLocalStorageData()) {
        console.log('⚠️ No localStorage data found')
        this.markMigrationCompleted()
        return {
          success: true,
          message: 'No data to migrate',
          stats,
        }
      }

      // Step 1: Migrate Tags
      console.log('🔄 Starting tag migration...')
      const localTags = this.getLocalStorageTags()
      stats.tagsTotal = localTags.length
      console.log(`📊 Found ${stats.tagsTotal} tags in localStorage:`, localTags)

      const tagIdMap = new Map<string, string>() // old ID -> new ID

      for (const tag of localTags) {
        console.log(`🏷️ Processing tag: ${tag.name} (${tag.id})`)
        
        // Skip predefined tags as they're created automatically
        if (tag.id.startsWith('predefined-')) {
          console.log(`  ↳ Predefined tag, looking for equivalent in Supabase...`)
          // Try to find the equivalent tag in Supabase
          const supabaseTags = await SupabaseTagService.getTags()
          const existing = supabaseTags.find(
            (t) => t.name.toLowerCase() === tag.name.toLowerCase()
          )
          if (existing) {
            console.log(`  ✅ Found equivalent: ${existing.id}`)
            tagIdMap.set(tag.id, existing.id)
            stats.tagsMigrated++
          } else {
            console.log(`  ⚠️ No equivalent found`)
          }
          continue
        }

        // Create custom tags
        console.log(`  ↳ Creating custom tag...`)
        const newTag = await SupabaseTagService.createTag(
          tag.name,
          tag.color,
          tag.category as 'broker' | 'strategy' | 'sector' | 'custom' | undefined
        )

        if (newTag) {
          console.log(`  ✅ Created: ${newTag.id}`)
          tagIdMap.set(tag.id, newTag.id)
          stats.tagsMigrated++
        } else {
          console.error(`  ❌ Failed to create tag`)
        }
      }

      console.log(`✅ Tags migrated: ${stats.tagsMigrated}/${stats.tagsTotal}`)

      // Step 2: Migrate Transactions
      console.log('🔄 Starting transaction migration...')
      const localTransactions = this.getLocalStorageTransactions()
      stats.transactionsTotal = localTransactions.length
      console.log(`📊 Found ${stats.transactionsTotal} transactions in localStorage:`, localTransactions)

      for (const tx of localTransactions) {
        console.log(`💼 Processing transaction: ${tx.symbol} (${tx.type}) - ${tx.quantity} shares`)
        
        // Map old tag IDs to new tag IDs
        const newTagIds = tx.tags
          ?.map((oldId) => tagIdMap.get(oldId))
          .filter((id): id is string => id !== undefined)

        console.log(`  ↳ Mapped tags: ${tx.tags?.length || 0} → ${newTagIds?.length || 0}`)

        const newTx = await SupabaseTransactionService.createTransaction({
          ...tx,
          tags: newTagIds || [],
        })

        if (newTx) {
          console.log(`  ✅ Created transaction: ${newTx.id}`)
          stats.transactionsMigrated++
        } else {
          console.error(`  ❌ Failed to create transaction`)
        }
      }

      console.log(
        `✅ Transactions migrated: ${stats.transactionsMigrated}/${stats.transactionsTotal}`
      )

      // Mark migration as completed
      this.markMigrationCompleted()

      return {
        success: true,
        message: `Successfully migrated ${stats.tagsMigrated} tags and ${stats.transactionsMigrated} transactions`,
        stats,
      }
    } catch (error) {
      console.error('❌ Migration failed:', error)
      return {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stats,
      }
    }
  }

  /**
   * Clear localStorage data after successful migration
   * (Keep as backup until user confirms)
   */
  static clearLocalStorageData(): void {
    try {
      localStorage.removeItem('transactions')
      localStorage.removeItem('investment-tags')
      console.log('✅ localStorage data cleared')
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }

  /**
   * Export localStorage data as JSON for backup
   */
  static exportLocalStorageData(): string {
    try {
      const transactions = this.getLocalStorageTransactions()
      const tags = this.getLocalStorageTags()

      return JSON.stringify(
        {
          transactions,
          tags,
          exportDate: new Date().toISOString(),
        },
        null,
        2
      )
    } catch (error) {
      console.error('Error exporting data:', error)
      return ''
    }
  }

  /**
   * Download backup as JSON file
   */
  static downloadBackup(): void {
    try {
      const data = this.exportLocalStorageData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `investment-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      console.log('✅ Backup downloaded')
    } catch (error) {
      console.error('Error downloading backup:', error)
    }
  }

  /**
   * Reset migration flag (for testing)
   */
  static resetMigration(): void {
    try {
      localStorage.removeItem(this.MIGRATION_KEY)
      console.log('✅ Migration flag reset')
    } catch (error) {
      console.error('Error resetting migration:', error)
    }
  }
}
