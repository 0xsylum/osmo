import React from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Clock, DollarSign, Settings } from 'lucide-react'
import { LICENSE_DURATIONS, formatDuration } from '@/types'

export const LicenseConfigurator = ({ modelId, currentConfig, onConfigUpdate }) => {
  const [licenseConfig, setLicenseConfig] = useState(currentConfig || {
    personal: { price: 0, duration: LICENSE_DURATIONS.PERPETUAL, enabled: false },
    indie: { price: 0, duration: LICENSE_DURATIONS.ONE_YEAR, enabled: false },
    commercial: { price: 0, duration: LICENSE_DURATIONS.ONE_YEAR, enabled: false },
    enterprise: { price: 0, duration: LICENSE_DURATIONS.TWO_YEARS, enabled: false }
  })

  const updateLicense = (licenseType, field, value) => {
    setLicenseConfig(prev => ({
      ...prev,
      [licenseType]: {
        ...prev[licenseType],
        [field]: value
      }
    }))
  }

  const handleSave = () => {
    // Convert to contract format
    const contractConfig = {
      personalPrice: licenseConfig.personal.price,
      indiePrice: licenseConfig.indie.price,
      commercialPrice: licenseConfig.commercial.price,
      enterprisePrice: licenseConfig.enterprise.price,
      personalDuration: licenseConfig.personal.duration,
      indieDuration: licenseConfig.indie.duration,
      commercialDuration: licenseConfig.commercial.duration,
      enterpriseDuration: licenseConfig.enterprise.duration
    }
    
    onConfigUpdate(modelId, contractConfig)
  }

  return (
    <Card>
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        License Configuration
      </h3>

      <div className="space-y-6">
        {/* PERSONAL License */}
        <div className="p-4 border border-dark-border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-white">Personal License</h4>
              <p className="text-gray-400 text-sm">Non-commercial use only</p>
            </div>
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Enable</span>
              <input
                type="checkbox"
                checked={licenseConfig.personal.enabled}
                onChange={(e) => updateLicense('personal', 'enabled', e.target.checked)}
                className="rounded"
              />
            </label>
          </div>

          {licenseConfig.personal.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Price (USDC)
                </label>
                <input
                  type="number"
                  value={licenseConfig.personal.price}
                  onChange={(e) => updateLicense('personal', 'price', parseInt(e.target.value) || 0)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Duration
                </label>
                <select
                  value={licenseConfig.personal.duration}
                  onChange={(e) => updateLicense('personal', 'duration', parseInt(e.target.value))}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
                >
                  <option value={LICENSE_DURATIONS.PERPETUAL}>Perpetual (Default)</option>
                  <option value={LICENSE_DURATIONS.THIRTY_DAYS}>30 Days</option>
                  <option value={LICENSE_DURATIONS.ONE_YEAR}>1 Year</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* INDIE License */}
        <div className="p-4 border border-dark-border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-white">Indie License</h4>
              <p className="text-gray-400 text-sm">For indie developers and small businesses</p>
            </div>
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Enable</span>
              <input
                type="checkbox"
                checked={licenseConfig.indie.enabled}
                onChange={(e) => updateLicense('indie', 'enabled', e.target.checked)}
                className="rounded"
              />
            </label>
          </div>

          {licenseConfig.indie.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price (USDC)</label>
                <input
                  type="number"
                  value={licenseConfig.indie.price}
                  onChange={(e) => updateLicense('indie', 'price', parseInt(e.target.value) || 0)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                <select
                  value={licenseConfig.indie.duration}
                  onChange={(e) => updateLicense('indie', 'duration', parseInt(e.target.value))}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
                >
                  <option value={LICENSE_DURATIONS.ONE_YEAR}>1 Year (Default)</option>
                  <option value={LICENSE_DURATIONS.THIRTY_DAYS}>30 Days</option>
                  <option value={LICENSE_DURATIONS.NINETY_DAYS}>90 Days</option>
                  <option value={LICENSE_DURATIONS.TWO_YEARS}>2 Years</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* COMMERCIAL License */}
        <div className="p-4 border border-dark-border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-white">Commercial License</h4>
              <p className="text-gray-400 text-sm">Full commercial rights for businesses</p>
            </div>
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Enable</span>
              <input
                type="checkbox"
                checked={licenseConfig.commercial.enabled}
                onChange={(e) => updateLicense('commercial', 'enabled', e.target.checked)}
                className="rounded"
              />
            </label>
          </div>

          {licenseConfig.commercial.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price (USDC)</label>
                <input
                  type="number"
                  value={licenseConfig.commercial.price}
                  onChange={(e) => updateLicense('commercial', 'price', parseInt(e.target.value) || 0)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                <select
                  value={licenseConfig.commercial.duration}
                  onChange={(e) => updateLicense('commercial', 'duration', parseInt(e.target.value))}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
                >
                  <option value={LICENSE_DURATIONS.ONE_YEAR}>1 Year (Default)</option>
                  <option value={LICENSE_DURATIONS.NINETY_DAYS}>90 Days</option>
                  <option value={LICENSE_DURATIONS.TWO_YEARS}>2 Years</option>
                  <option value={LICENSE_DURATIONS.PERPETUAL}>Perpetual</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ENTERPRISE License */}
        <div className="p-4 border border-dark-border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-white">Enterprise License</h4>
              <p className="text-gray-400 text-sm">For large corporations and broadcast</p>
            </div>
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Enable</span>
              <input
                type="checkbox"
                checked={licenseConfig.enterprise.enabled}
                onChange={(e) => updateLicense('enterprise', 'enabled', e.target.checked)}
                className="rounded"
              />
            </label>
          </div>

          {licenseConfig.enterprise.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price (USDC)</label>
                <input
                  type="number"
                  value={licenseConfig.enterprise.price}
                  onChange={(e) => updateLicense('enterprise', 'price', parseInt(e.target.value) || 0)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                <select
                  value={licenseConfig.enterprise.duration}
                  onChange={(e) => updateLicense('enterprise', 'duration', parseInt(e.target.value))}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
                >
                  <option value={LICENSE_DURATIONS.TWO_YEARS}>2 Years (Default)</option>
                  <option value={LICENSE_DURATIONS.ONE_YEAR}>1 Year</option>
                  <option value={LICENSE_DURATIONS.PERPETUAL}>Perpetual</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <Button onClick={handleSave} className="w-full mt-6">
        Save License Configuration
      </Button>
    </Card>
  )
}