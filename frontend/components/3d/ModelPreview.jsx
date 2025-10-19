import React from 'react'
import { ModelViewer } from './ModelViewer'

export const ModelPreview = ({ modelIPFS, interactive = false, className = '' }) => {
  // For previews in marketplace, we don't have tokenId yet
  // So we use preview mode with limited functionality
  return (
    <ModelViewer
      modelIPFS={modelIPFS}
      isPreview={true} // This enables preview/watermarked mode
      interactive={interactive}
      className={className}
    />
  )
}