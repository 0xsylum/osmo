import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESSES, ModelRegistryABI, ModelMarketplaceABI, ModelTokenABI } from '@/utils/web3-config'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { LICENSE_TYPES, formatDuration } from '@/types'

export function useMarketplace() {
  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  // ============ MODEL REGISTRY FUNCTIONS ============

  // Get model details from registry
  const getModel = (modelId) => useReadContract({
    address: CONTRACT_ADDRESSES.modelRegistry,
    abi: ModelRegistryABI,
    functionName: 'models',
    args: [modelId],
    enabled: !!modelId,
  })

  // Check if model is active
  const isModelActive = (modelId) => useReadContract({
    address: CONTRACT_ADDRESSES.modelRegistry,
    abi: ModelRegistryABI,
    functionName: 'isModelActive',
    args: [modelId],
    enabled: !!modelId,
  })

  // Get model count
  const getModelCount = () => useReadContract({
    address: CONTRACT_ADDRESSES.modelRegistry,
    abi: ModelRegistryABI,
    functionName: 'getModelCount',
  })

  // Get creator's models
  const getCreatorModels = (creatorAddress) => useReadContract({
    address: CONTRACT_ADDRESSES.modelRegistry,
    abi: ModelRegistryABI,
    functionName: 'getCreatorModels',
    args: [creatorAddress],
    enabled: !!creatorAddress,
  })

  // ============ MARKETPLACE FUNCTIONS ============

  // Check if model can be purchased
  const canPurchase = (modelId) => useReadContract({
    address: CONTRACT_ADDRESSES.modelMarketplace,
    abi: ModelMarketplaceABI,
    functionName: 'canPurchase',
    args: [modelId],
    enabled: !!modelId,
  })

  // Get license price
  const getLicensePrice = (modelId, licenseType) => useReadContract({
    address: CONTRACT_ADDRESSES.modelMarketplace,
    abi: ModelMarketplaceABI,
    functionName: 'getLicensePrice',
    args: [modelId, licenseType],
    enabled: !!modelId && !!licenseType,
  })

  // Get license duration
  const getLicenseDuration = (modelId, licenseType) => useReadContract({
    address: CONTRACT_ADDRESSES.modelMarketplace,
    abi: ModelMarketplaceABI,
    functionName: 'getLicenseDuration',
    args: [modelId, licenseType],
    enabled: !!modelId && !!licenseType,
  })

  // Get total price including variations
  const getTotalPrice = (modelId, licenseType, variationIds) => useReadContract({
    address: CONTRACT_ADDRESSES.modelMarketplace,
    abi: ModelMarketplaceABI,
    functionName: 'getTotalPrice',
    args: [modelId, licenseType, variationIds || []],
    enabled: !!modelId && !!licenseType,
  })

  // Get active variations
  const getActiveVariations = (modelId) => useReadContract({
    address: CONTRACT_ADDRESSES.modelMarketplace,
    abi: ModelMarketplaceABI,
    functionName: 'getActiveVariations',
    args: [modelId],
    enabled: !!modelId,
  })

  // Get royalty info
  const getRoyaltyInfo = (modelId, salePrice) => useReadContract({
    address: CONTRACT_ADDRESSES.modelMarketplace,
    abi: ModelMarketplaceABI,
    functionName: 'royaltyInfo',
    args: [modelId, salePrice],
    enabled: !!modelId,
  })

  // ============ MODEL TOKEN FUNCTIONS ============

  // Purchase model
  const purchaseModel = async (modelId, licenseType, variationIds, price) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.modelToken,
        abi: ModelTokenABI,
        functionName: 'purchaseModel',
        args: [modelId, licenseType, variationIds || []],
        value: price,
      })
      toast.success('Purchase initiated!')
    } catch (error) {
      toast.error('Purchase failed: ' + error.message)
    }
  }

  // Burn token for download
  const burnForDownload = async (tokenId) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.modelToken,
        abi: ModelTokenABI,
        functionName: 'burnForDownload',
        args: [tokenId],
      })
      toast.success('Download access requested!')
    } catch (error) {
      toast.error('Burn failed: ' + error.message)
    }
  }

  // Renew license
  const renewLicense = async (tokenId) => {
    try {
      // Get renewal price from contract (you might need to calculate this)
      const renewalPrice = 0 // You'll need to implement this calculation
      
      writeContract({
        address: CONTRACT_ADDRESSES.modelToken,
        abi: ModelTokenABI,
        functionName: 'renewLicense',
        args: [tokenId],
        value: renewalPrice,
      })
      toast.success('License renewal initiated!')
    } catch (error) {
      toast.error('Renewal failed: ' + error.message)
    }
  }

  // Check if license is valid
  const isLicenseValid = (tokenId) => useReadContract({
    address: CONTRACT_ADDRESSES.modelToken,
    abi: ModelTokenABI,
    functionName: 'isLicenseValid',
    args: [tokenId],
    enabled: !!tokenId,
  })

  // Get owned tokens
  const getOwnedTokens = (userAddress) => useReadContract({
    address: CONTRACT_ADDRESSES.modelToken,
    abi: ModelTokenABI,
    functionName: 'getOwnedTokens',
    args: [userAddress],
    enabled: !!userAddress,
  })

  // Get license time remaining
  const getLicenseTimeRemaining = (tokenId) => useReadContract({
    address: CONTRACT_ADDRESSES.modelToken,
    abi: ModelTokenABI,
    functionName: 'getLicenseTimeRemaining',
    args: [tokenId],
    enabled: !!tokenId,
  })

  // Get purchase snapshot
  const getPurchaseSnapshot = (tokenId) => useReadContract({
    address: CONTRACT_ADDRESSES.modelToken,
    abi: ModelTokenABI,
    functionName: 'purchaseSnapshots',
    args: [tokenId],
    enabled: !!tokenId,
  })

  return {
    // Registry functions
    getModel,
    isModelActive,
    getModelCount,
    getCreatorModels,

    // Marketplace functions
    canPurchase,
    getLicensePrice,
    getLicenseDuration,
    getTotalPrice,
    getActiveVariations,
    getRoyaltyInfo,

    // Token functions
    purchaseModel,
    burnForDownload,
    renewLicense,
    isLicenseValid,
    getOwnedTokens,
    getLicenseTimeRemaining,
    getPurchaseSnapshot,

    // Transaction status
    isConfirming,
    isConfirmed,
  }
}