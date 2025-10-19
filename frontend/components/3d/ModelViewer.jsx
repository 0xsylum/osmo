import React, { useRef, useEffect, useState } from 'react'
import { secureIPFSService } from '@/utils/ipfs'
import { useAccount } from 'wagmi'
import { Shield, AlertTriangle, Loader, PaintBucket } from 'lucide-react'
import { MATERIAL_PROPERTIES } from '@/types'

export const ModelViewer = ({ 
  modelIPFS, 
  tokenId,
  materialVariation = 0, 
  materials = [], // Array of material variations
  className = '',
  interactive = true,
  isPreview = false,
  onMaterialChange // Callback when material changes
}) => {
  const viewerRef = useRef()
  const { address } = useAccount()
  const [streaming, setStreaming] = useState(false)
  const [streamUrl, setStreamUrl] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentMaterialIndex, setCurrentMaterialIndex] = useState(materialVariation)

  // Update material when prop changes
  useEffect(() => {
    setCurrentMaterialIndex(materialVariation)
  }, [materialVariation])

  // Apply material properties to the 3D model
  const applyMaterialProperties = async (materialIndex) => {
    if (!viewerRef.current || !streaming || materials.length === 0) return

    try {
      const model = await viewerRef.current.getModel()
      if (model && model.materials) {
        const material = materials[materialIndex]
        if (!material) return

        console.log('Applying material properties:', material.properties)

        // Apply material properties to all materials in the model
        model.materials.forEach((modelMaterial) => {
          // Metallic roughness properties
          if (material.properties.metallic !== undefined) {
            modelMaterial.pbrMetallicRoughness.setMetallicFactor(material.properties.metallic)
          }
          if (material.properties.roughness !== undefined) {
            modelMaterial.pbrMetallicRoughness.setRoughnessFactor(material.properties.roughness)
          }

          // Clearcoat properties (for metals, plastics)
          if (material.properties.clearcoat !== undefined) {
            modelMaterial.setClearcoatFactor(material.properties.clearcoat)
          }
          if (material.properties.clearcoatRoughness !== undefined) {
            modelMaterial.setClearcoatRoughnessFactor(material.properties.clearcoatRoughness)
          }

          // Transmission/glass properties
          if (material.properties.transmission !== undefined) {
            modelMaterial.setTransmissionFactor(material.properties.transmission)
          }
          if (material.properties.ior !== undefined) {
            modelMaterial.setIor(material.properties.ior)
          }

          // Sheen properties (for fabrics)
          if (material.properties.sheen !== undefined) {
            modelMaterial.setSheenFactor(material.properties.sheen)
          }
          if (material.properties.sheenRoughness !== undefined) {
            modelMaterial.setSheenRoughnessFactor(material.properties.sheenRoughness)
          }

          // Base color variations based on material type
          if (material.previewColor) {
            // Convert hex to RGB
            const hex = material.previewColor.replace('#', '')
            const r = parseInt(hex.substr(0, 2), 16) / 255
            const g = parseInt(hex.substr(2, 2), 16) / 255
            const b = parseInt(hex.substr(4, 2), 16) / 255
            modelMaterial.pbrMetallicRoughness.setBaseColorFactor([r, g, b, 1.0])
          }
        })
      }
    } catch (error) {
      console.log('Material application failed:', error)
    }
  }

  // Handle material change
  const handleMaterialChange = (newIndex) => {
    setCurrentMaterialIndex(newIndex)
    applyMaterialProperties(newIndex)
    
    // Notify parent component
    if (onMaterialChange) {
      onMaterialChange(newIndex, materials[newIndex])
    }
  }

  useEffect(() => {
    if (streaming && materials.length > 0) {
      applyMaterialProperties(currentMaterialIndex)
    }
  }, [streaming, currentMaterialIndex, materials])

  // ... rest of streaming initialization code remains the same

  return (
    <div className={`relative ${className}`}>
      {/* Material Indicator */}
      {materials.length > 0 && streaming && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-purple-500/20 border border-purple-500 rounded-full px-3 py-1 flex items-center gap-2">
            <PaintBucket className="w-3 h-3 text-purple-400" />
            <span className="text-purple-400 text-xs font-medium">
              {materials[currentMaterialIndex]?.name || 'Material'}
            </span>
          </div>
        </div>
      )}

      {/* Security Badge */}
      {!isPreview && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-green-500/20 border border-green-500 rounded-full px-2 py-1 flex items-center gap-1">
            <Shield className="w-3 h-3 text-green-400" />
            <span className="text-green-400 text-xs font-medium">Secure</span>
          </div>
        </div>
      )}

      {/* Streaming Viewer */}
      <model-viewer
        ref={viewerRef}
        src={streamUrl || modelIPFS}
        alt="Secure 3D Model Stream"
        environment-image="neutral"
        exposure="1"
        shadow-intensity="1"
        camera-controls={interactive}
        auto-rotate={interactive && !isPreview}
        ar={!isPreview}
        ar-modes={!isPreview ? "webxr scene-viewer quick-look" : ""}
        className={`rounded-lg ${className}`}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#1e293b'
        }}
      >
        {/* AR Button - Only for licensed users */}
        {!isPreview && (
          <button slot="ar-button" className="ar-button">
            View in AR
          </button>
        )}

        {/* Loading Animation */}
        <div slot="progress-bar" className="progress-bar">
          <div className="update-bar"></div>
        </div>
      </model-viewer>
    </div>
  )
}