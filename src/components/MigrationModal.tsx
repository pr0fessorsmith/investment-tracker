'use client'

import { useState, useEffect } from 'react'
import { DataMigration } from '@/services/supabase/dataMigration'

interface MigrationModalProps {
  onComplete: () => void
}

export default function MigrationModal({ onComplete }: MigrationModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationComplete, setMigrationComplete] = useState(false)
  const [migrationStats, setMigrationStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if migration is needed
    const checkMigration = () => {
      if (
        !DataMigration.isMigrationCompleted() &&
        DataMigration.hasLocalStorageData()
      ) {
        setIsOpen(true)
      }
    }

    checkMigration()
  }, [])

  const handleMigrate = async () => {
    setIsMigrating(true)
    setError(null)

    try {
      const result = await DataMigration.migrateToSupabase()

      if (result.success) {
        setMigrationStats(result.stats)
        setMigrationComplete(true)
      } else {
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

  const handleSkip = () => {
    DataMigration.markMigrationCompleted()
    setIsOpen(false)
    onComplete()
  }

  const handleFinish = () => {
    setIsOpen(false)
    onComplete()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {migrationComplete ? '🎉 Migration Complete!' : '☁️ Cloud Storage Available'}
            </h2>
            <p className="text-gray-600">
              {migrationComplete
                ? 'Your data has been successfully migrated to cloud storage.'
                : 'We detected existing data in your browser. Would you like to move it to cloud storage?'}
            </p>
          </div>

          {!migrationComplete ? (
            <>
              {/* Benefits */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  ✨ Benefits of Cloud Storage:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Access your data from any device</li>
                  <li>• Automatic synchronization across all devices</li>
                  <li>• Never lose your data (secure cloud backup)</li>
                  <li>• Real-time updates when you make changes</li>
                </ul>
              </div>

              {/* Current Data Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  📊 Your Current Data:
                </h3>
                <div className="text-sm text-gray-700">
                  <p>
                    Local data found in your browser. This will be moved to secure cloud
                    storage.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800">
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
                    'Migrate to Cloud Storage'
                  )}
                </button>

                <button
                  onClick={handleDownloadBackup}
                  disabled={isMigrating}
                  className="sm:w-auto bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  📥 Download Backup
                </button>
              </div>

              {/* Skip Option */}
              <div className="mt-4 text-center">
                <button
                  onClick={handleSkip}
                  disabled={isMigrating}
                  className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
                >
                  Skip for now (keep using browser storage)
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Migration Success */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-900 mb-2">
                  ✅ Migration Successful!
                </h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p>• Tags migrated: {migrationStats?.tagsMigrated || 0}</p>
                  <p>
                    • Transactions migrated: {migrationStats?.transactionsMigrated || 0}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  Your data is now stored securely in the cloud. You can access it from any
                  device by signing in with your Google account.
                </p>
              </div>

              {/* Finish Button */}
              <button
                onClick={handleFinish}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue to App
              </button>

              {/* Optional: Clear Local Data */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    DataMigration.clearLocalStorageData()
                    handleFinish()
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear browser storage (recommended)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
