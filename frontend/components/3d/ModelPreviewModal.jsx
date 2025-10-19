import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { X, RotateCcw, ZoomIn, ZoomOut, Palette, Shield, ShoppingCart } from 'lucide-react'
import { ModelViewer } from './ModelViewer'
import { MaterialSwitcher } from './MaterialSwitcher'

export const ModelPreviewModal = ({ model, onClose, onPurchase }) => {
  const [currentMaterial, setCurrentMaterial] = useState(0)
  
  // Sample materials data - in production, this would come from model data
  const sampleMaterials = [
    {
      id: '1',
      name: 'Brushed Metal',
      type: 'metal',
      properties: { metallic: 1.0, roughness: 0.3 },
      price: 25,
      previewColor: '#94a3b8'
    },
    {
      id: '2', 
      name: 'Matte Plastic',
      type: 'plastic',
      properties: { metallic: 0.0, roughness: 0.4 },
      price: 0,
      previewColor: '#f1f5f9'
    },
    {
      id: '3',
      name: 'Tinted Glass',
      type: 'glass', 
      properties: { metallic: 0.0, roughness: 0.1, transmission: 0.8 },
      price: 35,
      previewColor: '#e0f2fe'
    }
  ]

  const handleMaterialChange = (materialIndex, material) => {
    setCurrentMaterial(materialIndex)
    console.log('Selected material:', material)
  }

  const handlePurchaseWithMaterial = () => {
    const selectedMaterial = sampleMaterials[currentMaterial]
    onPurchase(model, selectedMaterial)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Security Notice */}
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-blue-500/20 border border-blue-500 rounded-full px-3 py-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">Secure Preview</span>
            </div>
          </div>

          {/* 3D Viewer - 70% width */}
          <div className="flex-1 h-96 lg:h-full min-h-[400px]">
            <ModelViewer
              modelIPFS={model.modelIPFS}
              isPreview={true}
              materialVariation={currentMaterial}
              materials={sampleMaterials}
              onMaterialChange={handleMaterialChange}
              className="w-full h-full rounded-lg"
            />
          </div>

          {/* Model Info & Controls - 30% width */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-dark-border p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Model Info */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{model.name}</h2>
                <p className="text-gray-400 text-sm mb-3">{model.description}</p>
                <div className="text-accent-blue text-sm">{model.creator}</div>
              </div>

              {/* Material Variations */}
              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Material Variations
                </h3>
                <MaterialSwitcher
                  materials={sampleMaterials}
                  currentMaterial={currentMaterial}
                  onMaterialChange={handleMaterialChange}
                  showPrices={true}
                  interactive={true}
                />
              </div>

              {/* Purchase Summary */}
              <div className="bg-dark-border rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">Purchase Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base Model:</span>
                    <span className="text-white">{model.prices?.commercial || 150} USDC</span>
                  </div>
                  {sampleMaterials[currentMaterial].price > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Material ({sampleMaterials[currentMaterial].name}):</span>
                      <span className="text-success">+{sampleMaterials[currentMaterial].price} USDC</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-white border-t border-dark-border pt-2">
                    <span>Total:</span>
                    <span>
                      {model.prices?.commercial + sampleMaterials[currentMaterial].price} USDC
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button onClick={onClose} variant="secondary" className="flex-1">
                  Close Preview
                </Button>
                <Button onClick={handlePurchaseWithMaterial} className="flex-1">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Purchase with Material
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}