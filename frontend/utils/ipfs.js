import axios from 'axios'
import FormData from 'form-data'

// Encryption utilities
class EncryptionService {
  // Generate encryption key for each model
  static async generateEncryptionKey() {
    const key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    )
    return key
  }

  // Encrypt file before uploading to IPFS
  static async encryptFile(file, encryptionKey) {
    const arrayBuffer = await file.arrayBuffer()
    
    // Generate IV (Initialization Vector)
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    
    // Encrypt the file
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      encryptionKey,
      arrayBuffer
    )
    
    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encryptedBuffer.byteLength)
    result.set(iv, 0)
    result.set(new Uint8Array(encryptedBuffer), iv.length)
    
    return new Blob([result], { type: 'application/octet-stream' })
  }

  // Decrypt file for streaming
  static async decryptFile(encryptedBlob, encryptionKey) {
    const arrayBuffer = await encryptedBlob.arrayBuffer()
    const iv = arrayBuffer.slice(0, 12)
    const encryptedData = arrayBuffer.slice(12)
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      encryptionKey,
      encryptedData
    )
    
    return new Blob([decryptedBuffer])
  }

  // Export key for storage (encrypted with user's wallet)
  static async exportKey(encryptionKey, userPublicKey) {
    // This would use the user's wallet to encrypt the decryption key
    // For now, we'll simulate this
    const exported = await window.crypto.subtle.exportKey('jwk', encryptionKey)
    return JSON.stringify(exported)
  }

  // Import key for decryption
  static async importKey(exportedKey, userPrivateKey) {
    const jwk = JSON.parse(exportedKey)
    return await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'AES-GCM', length: 256 },
      true,
      ['decrypt']
    )
  }
}

// Streaming Service for Real-time 3D Viewing
class StreamingService {
  constructor() {
    this.streamingSessions = new Map()
  }

  // Start a streaming session for a model
  async startStreamingSession(modelIPFS, encryptionKey, tokenId) {
    const sessionId = `session_${tokenId}_${Date.now()}`
    
    // Create WebRTC-like streaming session (simplified for demo)
    const session = {
      id: sessionId,
      modelIPFS,
      encryptionKey,
      tokenId,
      createdAt: Date.now(),
      isActive: true,
      viewers: new Set()
    }
    
    this.streamingSessions.set(sessionId, session)
    return sessionId
  }

  // Get streaming URL for authorized users
  getStreamingUrl(sessionId, viewerAddress) {
    const session = this.streamingSessions.get(sessionId)
    if (!session || !session.isActive) {
      throw new Error('Streaming session not found or expired')
    }

    // Add viewer to session
    session.viewers.add(viewerAddress)

    // Return WebSocket-like streaming endpoint
    return `wss://stream.3dmarketplace.com/session/${sessionId}?viewer=${viewerAddress}`
  }

  // Stop streaming session
  stopStreamingSession(sessionId) {
    const session = this.streamingSessions.get(sessionId)
    if (session) {
      session.isActive = false
      this.streamingSessions.delete(sessionId)
    }
  }
}

// Enhanced IPFS Service with Encryption & Streaming
class SecureIPFSService {
  constructor() {
    this.encryptionService = EncryptionService
    this.streamingService = new StreamingService()
    this.pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY
    this.pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY
  }

  // ============ SECURE UPLOAD METHODS ============

  /**
   * Upload encrypted 3D model to IPFS
   */
  async uploadEncryptedModel(file, creatorAddress) {
    try {
      console.log('Encrypting and uploading 3D model:', file.name)

      // Generate unique encryption key for this model
      const encryptionKey = await this.encryptionService.generateEncryptionKey()
      
      // Encrypt the file
      const encryptedFile = await this.encryptionService.encryptFile(file, encryptionKey)
      
      // Upload encrypted file to IPFS
      const encryptedCID = await this.uploadToPinata(encryptedFile, `${file.name}.encrypted`)
      
      // Store encryption key securely (this would go to your backend in production)
      const encryptedKey = await this.encryptionService.exportKey(encryptionKey, creatorAddress)
      
      console.log('Model encrypted and uploaded. CID:', encryptedCID)
      
      return {
        encryptedCID,
        encryptionKey: encryptedKey, // This should be stored securely per user
        originalFileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('Secure upload failed:', error)
      throw new Error(`Secure upload failed: ${error.message}`)
    }
  }

  /**
   * Upload metadata (unencrypted, contains streaming info)
   */
  async uploadStreamingMetadata(modelInfo, licenseConfig, encryptedCID) {
    const metadata = {
      name: modelInfo.name,
      description: modelInfo.description,
      tags: modelInfo.tags,
      encryptedModelCID: encryptedCID,
      fileFormat: modelInfo.fileFormat,
      originalFileSize: modelInfo.fileSize,
      requiresDecryption: true,
      streamingSupported: true,
      licenseConfig: licenseConfig,
      technicalSpecs: {
        vertices: modelInfo.vertices || 0,
        triangles: modelInfo.triangles || 0,
        materials: modelInfo.materials || 1
      },
      createdAt: new Date().toISOString()
    }

    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json'
    })
    
    const metadataFile = new File([metadataBlob], 'streaming-metadata.json')
    const metadataCID = await this.uploadToPinata(metadataFile)

    return metadataCID
  }

  // ============ STREAMING ACCESS METHODS ============

  /**
   * Authorize user and start streaming session
   */
  async authorizeStreamingAccess(tokenId, userAddress, encryptedKey) {
    try {
      // Verify user owns the token (this would check your smart contract)
      const hasAccess = await this.verifyTokenOwnership(tokenId, userAddress)
      if (!hasAccess) {
        throw new Error('User does not have access to this model')
      }

      // Import decryption key
      const decryptionKey = await this.encryptionService.importKey(encryptedKey, userAddress)
      
      // Get model info from token metadata
      const modelInfo = await this.getModelInfoFromToken(tokenId)
      
      // Start streaming session
      const sessionId = await this.streamingService.startStreamingSession(
        modelInfo.encryptedModelCID,
        decryptionKey,
        tokenId
      )

      // Get streaming URL
      const streamingUrl = this.streamingService.getStreamingUrl(sessionId, userAddress)

      return {
        sessionId,
        streamingUrl,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }
      
    } catch (error) {
      console.error('Streaming authorization failed:', error)
      throw new Error(`Streaming authorization failed: ${error.message}`)
    }
  }

  /**
   * Get real-time 3D stream for authorized users
   */
  async getModelStream(tokenId, userAddress) {
    try {
      // This would connect to your streaming server
      // For now, we'll simulate the streaming setup
      
      const streamingInfo = await this.authorizeStreamingAccess(tokenId, userAddress)
      
      // In production, this would connect to a WebRTC/WebSocket streaming server
      // that decrypts and streams the 3D model in real-time
      
      return {
        type: 'websocket',
        url: streamingInfo.streamingUrl,
        sessionId: streamingInfo.sessionId,
        quality: 'adaptive',
        supportsAR: true,
        supportsVR: true,
        maxViewers: 10 // Simultaneous viewers per session
      }
      
    } catch (error) {
      console.error('Stream setup failed:', error)
      throw new Error(`Stream setup failed: ${error.message}`)
    }
  }

  // ============ SECURE DOWNLOAD (BURN TOKEN) ============

  /**
   * Generate secure download after token burn
   */
  async generateSecureDownload(tokenId, userAddress) {
    try {
      // Verify token is burned and user has download rights
      const canDownload = await this.verifyDownloadRights(tokenId, userAddress)
      if (!canDownload) {
        throw new Error('Download not authorized')
      }

      // Get model info and decryption key
      const modelInfo = await this.getModelInfoFromToken(tokenId)
      const decryptionKey = await this.getDecryptionKey(tokenId, userAddress)
      
      // Download and decrypt the file
      const encryptedBlob = await this.fetchFromIPFS(modelInfo.encryptedModelCID)
      const decryptedBlob = await this.encryptionService.decryptFile(encryptedBlob, decryptionKey)
      
      // Generate secure one-time download link
      const downloadKey = this.generateDownloadKey(tokenId, userAddress)
      const downloadUrl = await this.createSecureDownloadUrl(decryptedBlob, downloadKey)
      
      return {
        downloadUrl,
        downloadKey,
        expiresAt: Date.now() + (2 * 60 * 60 * 1000), // 2 hours
        maxDownloads: 1,
        fileSize: modelInfo.originalFileSize,
        fileName: modelInfo.originalFileName
      }
      
    } catch (error) {
      console.error('Secure download generation failed:', error)
      throw new Error(`Download generation failed: ${error.message}`)
    }
  }

  // ============ HELPER METHODS ============

  async verifyTokenOwnership(tokenId, userAddress) {
    // This would check your ModelToken contract
    // For now, simulate verification
    return true // In production, call contract method
  }

  async verifyDownloadRights(tokenId, userAddress) {
    // Check if token is burned and user has download access
    // This would check your ModelToken contract
    return true // In production, call contract method
  }

  async getModelInfoFromToken(tokenId) {
    // Fetch token metadata from IPFS
    // This would call your ModelToken contract's tokenURI method
    return {
      encryptedModelCID: 'QmExampleEncryptedModel',
      originalFileName: 'model.glb',
      fileSize: 1024000,
      // ... other model info
    }
  }

  async getDecryptionKey(tokenId, userAddress) {
    // Retrieve encrypted decryption key for this user/token
    // This would come from your secure key management system
    const encryptedKey = '' // Get from secure storage
    return await this.encryptionService.importKey(encryptedKey, userAddress)
  }

  generateDownloadKey(tokenId, userAddress) {
    return `dl_${tokenId}_${userAddress}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async createSecureDownloadUrl(decryptedBlob, downloadKey) {
    // Upload to temporary secure storage with expiration
    // In production, use signed URLs from your CDN
    const tempFile = new File([decryptedBlob], `download_${downloadKey}.glb`)
    const tempCID = await this.uploadToPinata(tempFile, `temp_download_${downloadKey}`)
    
    return this.getGatewayUrl(tempCID)
  }

  // ... rest of existing IPFS methods (uploadToPinata, etc.)
}

// Create singleton instance
export const secureIPFSService = new SecureIPFSService()
export default secureIPFSService