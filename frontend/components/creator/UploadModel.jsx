import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Upload, File, Info, AlertTriangle, CheckCircle } from 'lucide-react'
import { useCreator } from '@/hooks/useCreator'
import { ipfsService } from '@/utils/ipfs'
import { metadata3DService } from '@/utils/3d-metadata'

export const UploadModel = ({ onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('')
  const [metadata, setMetadata] = useState(null)
  const [validation, setValidation] = useState(null)

  const { registerModel } = useCreator()

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file
      const validation = ipfsService.validateModelFile(file)
      if (!validation.isValid) {
        alert(validation.errors.join('\n'))
        return
      }

      // Extract metadata
      try {
        setUploadStage('analyzing')
        const extractedMetadata = await metadata3DService.extractMetadata(file)
        setMetadata(extractedMetadata)
        setValidation(extractedMetadata.validation)
      } catch (error) {
        console.error('Metadata extraction failed:', error)
        alert('Could not analyze 3D model file')
        return
      }

      setFormData(prev => ({ ...prev, file }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.file || !metadata) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Step 1: Upload encrypted 3D model
      setUploadStage('encryption')
      setUploadProgress(20)
      
      const encryptedModel = await ipfsService.uploadEncryptedModel(
        formData.file, 
        userAddress
      )
      setUploadProgress(40)

      // Step 2: Prepare comprehensive metadata
      setUploadStage('metadata')
      setUploadProgress(60)
      
      const fullMetadata = {
        name: formData.name,
        description: formData.description,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        creator: userAddress,
        createdAt: new Date().toISOString(),
        
        // Technical specifications
        technicalSpecs: metadata.technical,
        
        // File information
        fileInfo: {
          originalName: formData.file.name,
          format: formData.file.name.split('.').pop(),
          size: formData.file.size,
          encryptedCID: encryptedModel.encryptedCID
        },
        
        // License configuration
        licenseConfig: formData.licenseConfig,
        
        // Validation results
        validation: metadata.validation,
        
        // Material variations (if any)
        materials: formData.materials || []
      }

      const metadataCID = await ipfsService.uploadMetadata(fullMetadata)
      setUploadProgress(80)

      // Step 3: Register on blockchain
      setUploadStage('contract')
      await registerModel(encryptedModel.encryptedCID, metadataCID)
      setUploadProgress(100)

      onUploadComplete()
      
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error.message}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setUploadStage('')
    }
  }

  return (
    <Card>
      <h2 className="text-2xl font-bold text-white mb-6">Upload 3D Model</h2>

      {/* Technical Specifications Display */}
      {metadata && (
        <div className="mb-6 p-4 bg-dark-border rounded-lg">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Technical Specifications
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Vertices</div>
              <div className="text-white font-semibold">
                {metadata.technical.vertices?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Triangles</div>
              <div className="text-white font-semibold">
                {metadata.technical.triangles?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Materials</div>
              <div className="text-white font-semibold">
                {metadata.technical.materials || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">File Size</div>
              <div className="text-white font-semibold">
                {(formData.file?.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
          </div>

          {/* Validation Results */}
          {validation && (
            <div className={`mt-3 p-3 rounded-lg ${
              validation.isValid ? 'bg-green-500/10 border border-green-500' : 'bg-yellow-500/10 border border-yellow-500'
            }`}>
              <div className="flex items-center gap-2 text-sm">
                {validation.isValid ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                )}
                <span className={validation.isValid ? 'text-green-400' : 'text-yellow-400'}>
                  {validation.isValid ? 'Model is web-ready' : 'Model may need optimization'}
                </span>
              </div>
              
              {validation.issues.length > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  {validation.issues.map((issue, index) => (
                    <div key={index}>• {issue.message}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ... rest of upload form */}
    </Card>
  )
}