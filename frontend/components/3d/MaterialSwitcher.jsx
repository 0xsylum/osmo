import React from 'react'
import { Check, DollarSign, Eye, PaintBucket } from 'lucide-react'
import { MATERIAL_TYPES } from '@/types'

export const MaterialSwitcher = ({ 
  materials, 
  currentMaterial, 
  onMaterialChange,
  showPrices = true,
  interactive = true 
}) => {
  const getMaterialIcon = (type) => {
    const icons = {
      [MATERIAL_TYPES.METAL]: '🔩',
      [MATERIAL_TYPES.PLASTIC]: '🧪',
      [MATERIAL_TYPES.GLASS]: '🔍',
      [MATERIAL_TYPES.WOOD]: '🪵',
      [MATERIAL_TYPES.FABRIC]: '🧵'
    }
    return icons[type] || '🎨'
  }

  const getMaterialDescription = (type) => {
    const descriptions = {
      [MATERIAL_TYPES.METAL]: 'Metallic finish with realistic reflections',
      [MATERIAL_TYPES.PLASTIC]: 'Smooth plastic surface with subtle sheen',
      [MATERIAL_TYPES.GLASS]: 'Transparent material with refraction',
      [MATERIAL_TYPES.WOOD]: 'Natural wood grain texture',
      [MATERIAL_TYPES.FABRIC]: 'Soft fabric with micro-details'
    }
    return descriptions[type] || 'Custom material properties'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
        <PaintBucket className="w-4 h-4" />
        <span>Material Variations</span>
      </div>
      
      {materials.map((material, index) => (
        <div
          key={material.id}
          className={`p-4 border rounded-lg cursor-pointer transition-all group ${
            currentMaterial === index
              ? 'border-accent-purple bg-purple-500/10 shadow-lg scale-105'
              : 'border-dark-border hover:border-gray-400 hover:bg-gray-500/5'
          } ${!interactive ? 'opacity-60 cursor-not-allowed' : ''}`}
          onClick={() => interactive && onMaterialChange(index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Material Preview */}
              <div className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-gray-600 flex items-center justify-center text-lg transition-all group-hover:border-gray-400"
                  style={{ 
                    backgroundColor: material.previewColor,
                    borderColor: currentMaterial === index ? '#a78bfa' : '#475569'
                  }}
                >
                  {getMaterialIcon(material.type)}
                </div>
                {!interactive && (
                  <div className="text-xs text-gray-500 mt-1">Purchase to unlock</div>
                )}
              </div>
              
              {/* Material Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white text-sm truncate">
                    {material.name}
                  </h4>
                  {material.type !== MATERIAL_TYPES.CUSTOM && (
                    <span className="px-1.5 py-0.5 bg-gray-600 rounded text-xs text-gray-300 capitalize">
                      {material.type}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {getMaterialDescription(material.type)}
                </p>
                
                {/* Material Properties Preview */}
                <div className="flex gap-3 mt-2">
                  {material.properties.metallic !== undefined && (
                    <div className="text-xs text-gray-500">
                      Metallic: {(material.properties.metallic * 100).toFixed(0)}%
                    </div>
                  )}
                  {material.properties.roughness !== undefined && (
                    <div className="text-xs text-gray-500">
                      Roughness: {(material.properties.roughness * 100).toFixed(0)}%
                    </div>
                  )}
                  {material.properties.transmission !== undefined && (
                    <div className="text-xs text-gray-500">
                      Transparency: {(material.properties.transmission * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Price and Selection */}
            <div className="flex items-center gap-3 pl-4">
              {showPrices && material.price > 0 && (
                <div className="text-right">
                  <div className="text-success font-semibold text-sm">
                    +{material.price} USDC
                  </div>
                  <div className="text-gray-400 text-xs">Additional</div>
                </div>
              )}
              
              {interactive && (
                <div className="flex items-center gap-2">
                  {currentMaterial === index ? (
                    <div className="flex items-center gap-1 text-accent-purple">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                  ) : (
                    <button 
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-600 hover:bg-gray-500 rounded px-2 py-1 text-xs text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        onMaterialChange(index)
                      }}
                    >
                      <Eye className="w-3 h-3 inline mr-1" />
                      Preview
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}