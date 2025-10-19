import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Clock, AlertTriangle, Check, Settings } from 'lucide-react'
import { useCreator } from '@/hooks/useCreator'
import { LICENSE_TYPES, formatDuration, getRemainingTime, isLicenseExpired } from '@/types'

export const LicenseManager = ({ modelId }) => {
  const [editingLicense, setEditingLicense] = useState(null)
  const { setLicenseConfig } = useCreator()

  // Mock data - replace with actual contract data
  const [licenseConfig, setLocalLicenseConfig] = useState({
    personalPrice: 50,
    indiePrice: 150,
    commercialPrice: 300,
    enterprisePrice: 1000,
    personalDuration: LICENSE_TYPES.PERSONAL.duration,
    indieDuration: LICENSE_TYPES.INDIE.duration,
    commercialDuration: LICENSE_TYPES.COMMERCIAL.duration,
    enterpriseDuration: LICENSE_TYPES.ENTERPRISE.duration
  })

  const handleSaveLicenseConfig = async () => {
    try {
      await setLicenseConfig(modelId, licenseConfig)
      setEditingLicense(null)
    } catch (error) {
      console.error('Failed to update license config:', error)
    }
  }

  const updateLicenseDuration = (licenseType, newDuration) => {
    setLocalLicenseConfig(prev => ({
      ...prev,
      [`${licenseType.toLowerCase()}Duration`]: newDuration
    }))
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">License Configuration</h3>
        <Button
          variant="secondary"
          onClick={() => setEditingLicense(!editingLicense)}
        >
          <Settings className="w-4 h-4 mr-2" />
          {editingLicense ? 'Cancel Editing' : 'Edit Licenses'}
        </Button>
      </div>

      <div className="space-y-4">
        {Object.entries(LICENSE_TYPES).map(([key, license]) => {
          const price = licenseConfig[`${key.toLowerCase()}Price`]
          const duration = licenseConfig[`${key.toLowerCase()}Duration`]
          const isActive = price > 0

          return (
            <div
              key={key}
              className="p-4 border border-dark-border rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-white">{license.name}</h4>
                  <p className="text-gray-400 text-sm">{license.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-success font-bold text-lg">{price} USDC</div>
                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    {formatDuration(duration)}
                  </div>
                </div>
              </div>

              {editingLicense && (
                <div className="border-t border-dark-border pt-3 mt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Duration
                      </label>
                      <select
                        value={duration}
                        onChange={(e) => updateLicenseDuration(key, parseInt(e.target.value))}
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
                      >
                        <option value={LICENSE_DURATIONS.PERPETUAL}>Perpetual</option>
                        <option value={LICENSE_DURATIONS.THIRTY_DAYS}>30 Days</option>
                        <option value={LICENSE_DURATIONS.NINETY_DAYS}>90 Days</option>
                        <option value={LICENSE_DURATIONS.ONE_YEAR}>1 Year</option>
                        <option value={LICENSE_DURATIONS.TWO_YEARS}>2 Years</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Price (USDC)
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setLocalLicenseConfig(prev => ({
                          ...prev,
                          [`${key.toLowerCase()}Price`]: parseInt(e.target.value) || 0
                        }))}
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-2">
                {license.features.map((feature, index) => (
                  <div key={index} className="text-xs text-gray-400 flex items-center gap-1">
                    • {feature}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {editingLicense && (
        <div className="flex gap-3 mt-6 pt-4 border-t border-dark-border">
          <Button onClick={handleSaveLicenseConfig}>
            Save License Configuration
          </Button>
          <Button variant="secondary" onClick={() => setEditingLicense(false)}>
            Cancel
          </Button>
        </div>
      )}
    </Card>
  )
}