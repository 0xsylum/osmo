import React, { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { X, Clock, Check, AlertTriangle, Calendar } from 'lucide-react'
import { useMarketplace } from '@/hooks/useMarketplace'
import { useAccount } from 'wagmi'
import { LICENSE_TYPES, formatDuration, isLicenseExpired } from '@/types'

export const PurchaseModal = ({ model, isOpen, onClose, onPurchase }) => {
  const [selectedLicense, setSelectedLicense] = useState('COMMERCIAL')
  const [selectedVariations, setSelectedVariations] = useState([])
  const { address } = useAccount()
  
  const { purchaseModel, isConfirming, getLicenseExpiry, isLicenseValid } = useMarketplace()
  
  // Check existing license status
  const { data: existingExpiry } = getLicenseExpiry(model.id, address)
  const { data: isCurrentlyValid } = isLicenseValid(model.id, address)

  const license = LICENSE_TYPES[selectedLicense]
  const basePrice = model.prices[selectedLicense] || 0
  
  const variationPrice = selectedVariations.reduce((total, variationId) => {
    const variation = model.variations.find(v => v.id === variationId)
    return total + (variation?.price || 0)
  }, 0)

  const totalPrice = basePrice + variationPrice

  const handlePurchase = async () => {
    // Check if user already has a valid license
    if (isCurrentlyValid && !isLicenseExpired(existingExpiry)) {
      const confirmUpgrade = window.confirm(
        'You already have a valid license for this model. Do you want to purchase an upgrade?'
      )
      if (!confirmUpgrade) return
    }

    await purchaseModel(
      model.id,
      selectedLicense,
      selectedVariations,
      totalPrice
    )
    onPurchase(model.id, selectedLicense, selectedVariations, totalPrice)
  }

  const getExpiryText = () => {
    if (!existingExpiry) return null
    
    if (isLicenseExpired(existingExpiry)) {
      return {
        text: 'Your previous license has expired',
        type: 'error'
      }
    } else {
      return {
        text: `Your current license expires in ${formatDuration(existingExpiry - Math.floor(Date.now() / 1000))}`,
        type: 'warning'
      }
    }
  }

  const expiryInfo = getExpiryText()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Purchase {model.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Existing License Warning */}
        {expiryInfo && (
          <div className={`p-3 rounded-lg mb-4 ${
            expiryInfo.type === 'error' ? 'bg-error/10 border border-error' : 'bg-warning/10 border border-warning'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{expiryInfo.text}</span>
            </div>
          </div>
        )}



        {/* License Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select License Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(LICENSE_TYPES).map(([key, license]) => (
              <div
                key={key}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedLicense === key
                    ? 'border-accent-blue bg-blue-500/10'
                    : 'border-dark-border hover:border-gray-400'
                }`}
                onClick={() => setSelectedLicense(key)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">{license.name}</span>
                  {selectedLicense === key && (
                    <Check className="w-5 h-5 text-accent-blue" />
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-2">{license.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-success font-bold">
                    {model.prices[key]} USDC
                  </span>
                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    {formatDuration(license.duration)}
                  </div>
                </div>
                {/* License Features */}
                <div className="mt-2">
                  {license.features.map((feature, index) => (
                    <div key={index} className="text-xs text-gray-400 flex items-center gap-1">
                      • {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

 // In the purchase modal, include material selection and pricing
const getTotalPrice = (basePrice, selectedMaterial, selectedVariations = []) => {
  let total = basePrice
  
  // Add material price
  if (selectedMaterial && selectedMaterial.price > 0) {
    total += selectedMaterial.price
  }
  
  // Add variation prices
  selectedVariations.forEach(variationId => {
    const variation = model.variations.find(v => v.id === variationId)
    if (variation) {
      total += variation.price
    }
  })
  
  return total
} 

        {/* Variations and purchase summary remain the same but now with real duration logic */}
        
        <Button
          onClick={handlePurchase}
          loading={isConfirming}
          className="w-full"
        >
          {isCurrentlyValid ? 'Upgrade License' : 'Purchase'} for {totalPrice} USDC
        </Button>
      </Card>
    </div>
  )
}



