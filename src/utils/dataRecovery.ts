// Data Recovery Utility
// Use this in browser console if transactions are missing

export const dataRecovery = {
  // Check if transactions exist in localStorage
  checkLocalStorage: () => {
    const transactions = localStorage.getItem('investment-transactions')
    console.log('Raw localStorage data:', transactions)
    
    if (transactions) {
      try {
        const parsed = JSON.parse(transactions)
        console.log('Parsed transactions:', parsed)
        console.log('Number of transactions found:', parsed.length)
        return parsed
      } catch (error) {
        console.error('Error parsing transactions:', error)
        return null
      }
    } else {
      console.log('No transactions found in localStorage')
      return null
    }
  },

  // Backup current transactions
  backupTransactions: () => {
    const transactions = localStorage.getItem('investment-transactions')
    if (transactions) {
      const backup = `investment-transactions-backup-${Date.now()}`
      localStorage.setItem(backup, transactions)
      console.log('Backup created:', backup)
      return backup
    }
    return null
  },

  // Restore transactions from a backup
  restoreFromBackup: (backupKey: string) => {
    const backup = localStorage.getItem(backupKey)
    if (backup) {
      localStorage.setItem('investment-transactions', backup)
      console.log('Transactions restored from:', backupKey)
      window.location.reload() // Reload to update UI
    }
  },

  // List all localStorage keys
  listAllKeys: () => {
    const keys = Object.keys(localStorage)
    console.log('All localStorage keys:', keys)
    return keys.filter(key => key.includes('investment'))
  },

  // Clear all investment data (use with caution!)
  clearAllData: () => {
    const keys = Object.keys(localStorage).filter(key => key.includes('investment'))
    keys.forEach(key => localStorage.removeItem(key))
    console.log('Cleared keys:', keys)
  }
}

// Auto-run check when imported
console.log('=== Data Recovery Utility Loaded ===')
dataRecovery.checkLocalStorage()
dataRecovery.listAllKeys()

// Make available globally for console use
if (typeof window !== 'undefined') {
  (window as any).dataRecovery = dataRecovery
}
