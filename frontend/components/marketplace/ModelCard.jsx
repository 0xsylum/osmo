import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Eye, Download, ShoppingCart, Clock, Crown, ZoomIn, Shield } from 'lucide-react'
import { useMarketplace } from '@/hooks/useMarketplace'
import { LICENSE_TYPES, formatDuration } from '@/types'
import { ModelPreview } from '../3d/ModelPreview'
import { ModelPreviewModal } from '../3d/ModelPreviewModal'

export const ModelCard = ({ model, onView, onPurchase }) => {
  const { data: modelDetails } = useMarketplace().getModel(model.id)
  const { data: canPurchase } = useMarketplace().canPurchase(model.id)
  const [show3DPreview, setShow3DPreview] = useState(false)

  // Get available license types and their durations
  const availableLicenses = Object.entries(LICENSE_TYPES).filter(([key]) => 
    model.prices && model.prices[key] !== undefined
  )

  const cheapestLicense = availableLicenses.reduce((cheapest, [key, license]) => {
    const price = model.prices[key]
    return !cheapest || price < cheapest.price ? { key, license, price } : cheapest
  }, null)

  if (!modelDetails) return null

  return (
    <Card hover={true}>
      <div className="flex flex-col h-full">
        {/* Secure 3D Model Preview */}
        <div className="relative w-full h-48 bg-gradient-to-br from-dark-border to-dark-bg rounded-lg mb-4 overflow-hidden">
          {/* Security Badge */}
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-blue-500/20 border border-blue-500 rounded-full px-2 py-1 flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-blue-400 text-xs font-medium">Protected</span>
            </div>
          </div>
          
          {/* Secure Preview */}
          <ModelPreview
            modelIPFS={model.modelIPFS}
            interactive={false}
            className="w-full h-full"
          />
          
          {/* Preview Overlay */}
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button
              onClick={() => setShow3DPreview(true)}
              className="bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
              title="View Secure Preview"
            >
              <ZoomIn className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={onView}
              className="bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4 text-white" />
            </button>
          </div>
          
          {/* License Badges */}
          <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end">
            {availableLicenses.map(([key, license]) => (
              <div
                key={key}
                className="px-2 py-1 bg-black/50 rounded-full text-xs text-white flex items-center gap-1"
                title={`${license.name} License - ${formatDuration(license.duration)}`}
              >
                {key === 'ENTERPRISE' && <Crown className="w-3 h-3" />}
                {license.name}
              </div>
            ))}
          </div>
        </div>
 // Add technical specs to model card
<div className="mt-2 text-xs text-gray-500">
  <div className="flex justify-between">
    <span>Vertices: {model.technicalSpecs?.vertices?.toLocaleString()}</span>
    <span>Materials: {model.technicalSpecs?.materials}</span>
  </div>
</div> 
        {/* Rest of ModelCard remains the same */}
        {/* ... */}
      </div>

      {/* Secure Preview Modal */}
      {show3DPreview && (
        <ModelPreviewModal
          model={model}
          onClose={() => setShow3DPreview(false)}
        />
      )}
    </Card>
  )
}