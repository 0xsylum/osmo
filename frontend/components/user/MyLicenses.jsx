import React from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Clock, Download, AlertTriangle, Check, Crown, RefreshCw } from 'lucide-react'
import { useMarketplace } from '@/hooks/useMarketplace'
import { useAccount } from 'wagmi'
import { formatDuration, getRemainingTime, isLicenseExpired, LICENSE_DURATIONS } from '@/types'

export const MyLicenses = () => {
  const { address } = useAccount()
  const { burnForDownload, renewLicense, getUserLicenses, isConfirming } = useMarketplace()
  
  // Get real user licenses from contract
  const { data: userLicenses = [] } = getUserLicenses(address)

  const handleDownload = async (tokenId) => {
    await burnForDownload(tokenId)
  }

  const handleRenew = async (tokenId, renewalOption = 'ONE_YEAR') => {
    const duration = LICENSE_DURATIONS[renewalOption]
    await renewLicense(tokenId, duration)
  }

  const getRenewalPrice = (originalPrice, renewalOption) => {
    // Calculate renewal price (e.g., 80% of original for 1-year renewal)
    const multipliers = {
      THIRTY_DAYS: 0.3,
      NINETY_DAYS: 0.6,
      ONE_YEAR: 0.8,
      TWO_YEARS: 1.5
    }
    return Math.floor(originalPrice * (multipliers[renewalOption] || 0.8))
  }

  if (userLicenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📜</div>
        <h3 className="text-xl text-gray-300 mb-2">No licenses yet</h3>
        <p className="text-gray-400">Purchase your first 3D model to get started!</p>
      </div>
    )
  }

  return (
    <Card>
      <h2 className="text-2xl font-bold text-white mb-6">My Licenses</h2>
      
      <div className="space-y-4">
        {userLicenses.map(license => {
          const isExpired = isLicenseExpired(license.expiresAt)
          const canDownload = !license.burned && !isExpired
          const remainingTime = getRemainingTime(license.expiresAt)

          return (
            <div
              key={license.tokenId}
              className="p-4 border border-dark-border rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{license.modelName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${
                      license.licenseType === 'ENTERPRISE' ? 'bg-purple-500' :
                      license.licenseType === 'COMMERCIAL' ? 'bg-green-500' :
                      license.licenseType === 'INDIE' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}>
                      {license.licenseType}
                      {license.licenseType === 'ENTERPRISE' && <Crown className="w-3 h-3 inline ml-1" />}
                    </span>
                    <span className="text-success font-bold">{license.pricePaid} USDC</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`flex items-center gap-1 text-sm ${
                    isExpired ? 'text-error' : 'text-gray-400'
                  }`}>
                    <Clock className="w-4 h-4" />
                    {remainingTime}
                  </div>
                  {isExpired && (
                    <div className="flex items-center gap-1 text-error text-sm mt-1">
                      <AlertTriangle className="w-4 h-4" />
                      Expired
                    </div>
                  )}
                  {license.burned && (
                    <div className="flex items-center gap-1 text-success text-sm mt-1">
                      <Check className="w-4 h-4" />
                      Downloaded
                    </div>
                  )}
                </div>
              </div>

              {/* Renewal Options for Expired Licenses */}
              {isExpired && (
                <div className="bg-error/10 border border-error rounded-lg p-3 mb-3">
                  <h4 className="font-semibold text-error mb-2">License Expired - Renew Now</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRenew(license.tokenId, 'ONE_YEAR')}
                      loading={isConfirming}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Renew 1 Year ({getRenewalPrice(license.pricePaid, 'ONE_YEAR')} USDC)
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRenew(license.tokenId, 'TWO_YEARS')}
                      loading={isConfirming}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Renew 2 Years ({getRenewalPrice(license.pricePaid, 'TWO_YEARS')} USDC)
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-dark-border">
                <div className="text-gray-400 text-sm">
                  Purchased {new Date(license.purchasedAt * 1000).toLocaleDateString()}
                  {license.variations.length > 0 && (
                    <span className="ml-2">
                      • {license.variations.length} variation(s)
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {canDownload && (
                    <Button
                      size="sm"
                      onClick={() => handleDownload(license.tokenId)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Files
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}