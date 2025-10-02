'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { DataMigration } from '@/services/supabase/dataMigration'

export default function DataMigrationButton() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Don't show button if not authenticated or no local data
  const hasLocalData = typeof window !== 'undefined' && DataMigration.hasLocalStorageData()
  if (!session || !hasLocalData) return null

  const handleMigrate = async () => {
    setIsMigrating(true)
    setError(null)
    setMigrationResult(null)

    try {
      const result = await DataMigration.migrateToSupabase()
      setMigrationResult(result)
      
      if (!result.success) {
        setError(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsMigrating(false)
    }
  }

  const handleDownloadBackup = () => {
    DataMigration.downloadBackup()
  }

  const handleClearLocal = () => {
    if (window.confirm('Are you sure you want to clear local browser data? This cannot be undone. Make sure your data is migrated to cloud storage first!')) {
      DataMigration.clearLocalStorageData()
      setIsOpen(false)
      window.location.reload()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
        title="Migrate local browser data to cloud storage"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        Migrate to Cloud
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {migrationResult?.success ? '🎉 Migration Complete!' : '☁️ Migrate to Cloud Storage'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {migrationResult?.success
                  ? 'Your data has been successfully migrated to cloud storage.'
                  : 'Move your local browser data to secure cloud storage.'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {!migrationResult?.success ? (
            <>
              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  ✨ What happens during migration:
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• All your transactions will be copied to cloud storage</li>
                  <li>• All your tags will be copied to cloud storage</li>
                  <li>• Your local data will remain untouched (you can clear it later)</li>
                  <li>• You can access your data from any device after migration</li>
                </ul>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  ⚠️ Before you start:
                </h3>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li>• Download a backup first (recommended)</li>
                  <li>• Make sure you&apos;re signed in with the correct Google account</li>
                  <li>• This process may take a few moments</li>
                </ul>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Error:</strong> {error}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleMigrate}
                  disabled={isMigrating}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isMigrating ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Migrating...
                    </span>
                  ) : (
                    'Start Migration'
                  )}
                </button>

                <button
                  onClick={handleDownloadBackup}
                  disabled={isMigrating}
                  className="sm:w-auto bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  📥 Download Backup
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success */}
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✅ Migration Successful!
                </h3>
                <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <p>• Tags migrated: {migrationResult?.stats?.tagsMigrated || 0} / {migrationResult?.stats?.tagsTotal || 0}</p>
                  <p>• Transactions migrated: {migrationResult?.stats?.transactionsMigrated || 0} / {migrationResult?.stats?.transactionsTotal || 0}</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Your data is now stored securely in the cloud. You can access it from any device by signing in with your Google account.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    window.location.reload()
                  }}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>

                <button
                  onClick={handleClearLocal}
                  className="w-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 py-3 px-6 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  Clear Local Browser Data
                </button>

                <button
                  onClick={handleDownloadBackup}
                  className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  📥 Download Backup (Before Clearing)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
