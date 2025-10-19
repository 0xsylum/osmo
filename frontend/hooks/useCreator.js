import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { CONTRACT_ADDRESSES, ModelRegistryABI, ModelMarketplaceABI } from '@/utils/web3-config'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { LICENSE_TYPES } from '@/types'

export function useCreator() {
  const { address } = useAccount()
  const { writeContract } = useWriteContract()

  // ============ MODEL REGISTRY FUNCTIONS ============

  // Register new model
  const registerModel = async (modelIPFS, metadataIPFS) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.modelRegistry,
        abi: ModelRegistryABI,
        functionName: 'registerModel',
        args: [modelIPFS, metadataIPFS],
      })
      toast.success('Model registration initiated!')
    } catch (error) {
      toast.error('Registration failed: ' + error.message)
    }
  }

  // Register derivative model
  const registerDerivativeModel = async (modelIPFS, metadataIPFS, originalModelId) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.modelRegistry,
        abi: ModelRegistryABI,
        functionName: 'registerDerivativeModel',
        args: [modelIPFS, metadataIPFS, originalModelId],
      })
      toast.success('Derivative model registration initiated!')
    } catch (error) {
      toast.error('Derivative registration failed: ' + error.message)
    }
  }

  // Update model metadata
  const updateMetadata = async (modelId, newMetadataIPFS) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.modelRegistry,
        abi: ModelRegistryABI,
        functionName: 'updateMetadata',
        args: [modelId, newMetadataIPFS],
      })
      toast.success('Metadata update initiated!')
    } catch (error) {
      toast.error('Metadata update failed: ' + error.message)
    }
  }

  // Toggle model active status
  const toggleModelActive = async (modelId) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.modelRegistry,
        abi: ModelRegistryABI,
        functionName: 'toggleModelActive',
        args: [modelId],
      })
      toast.success('Model status updated!')
    } catch (error) {
      toast.error('Status update failed: ' + error.message)
    }
  }

  // ============ MARKETPLACE FUNCTIONS ============

  // Set license configuration
  const setLicenseConfig = async (modelId, config) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.modelMarketplace,
        abi: ModelMarketplaceABI,
        functionName: 'setLicenseConfig',
        args: [modelId, config],
      })
      toast.success('License configuration updated!')
    } catch (error) {
      toast.error('Configuration failed: ' + error.message)
    }
  }

  // Set individual license price
  const setLicensePrice = async (modelId, licenseType, price) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.modelMarketplace,
        abi: ModelMarketplaceABI,
        functionName: 'setLicensePrice',
        args: [modelId, licenseType, price],
      })
      toast.success('License price updated!')
    } catch (error) {
      toast.error('Price update failed: ' + error.message)
    }
  }

  // Set royalty
  const setRoyalty = async (modelId, recipient, bps) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.modelMarketplace,
        abi: ModelMarketplaceABI,
        functionName: 'setRoyalty',
        args: [modelId, recipient, bps],
      })
      toast.success('Royalty configuration updated!')
    } catch (error) {
      toast.error('Royalty update failed: ' + error.message)
    }
  }

  // Add variation
  const addVariation = async (modelId, name, price, metadataIPFS) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.modelMarketplace,
        abi: ModelMarketplaceABI,
        functionName: 'addVariation',
        args: [modelId, name, price, metadataIPFS],
      })
      toast.success('Variation added!')
    } catch (error) {
      toast.error('Failed to add variation: ' + error.message)
    }
  }

  // Toggle variation active status
  const toggleVariationActive = async (modelId, variationIndex) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.modelMarketplace,
        abi: ModelMarketplaceABI,
        functionName: 'toggleVariationActive',
        args: [modelId, variationIndex],
      })
      toast.success('Variation status updated!')
    } catch (error) {
      toast.error('Variation update failed: ' + error.message)
    }
  }

  // Set max supply
  const setMaxSupply = async (modelId, maxSupply) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.modelMarketplace,
        abi: ModelMarketplaceABI,
        functionName: 'setMaxSupply',
        args: [modelId, maxSupply],
      })
      toast.success('Max supply updated!')
    } catch (error) {
      toast.error('Supply update failed: ' + error.message)
    }
  }

  // Toggle for sale status
  const toggleForSale = async (modelId) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.modelMarketplace,
        abi: ModelMarketplaceABI,
        functionName: 'toggleForSale',
        args: [modelId],
      })
      toast.success('Sale status updated!')
    } catch (error) {
      toast.error('Sale status update failed: ' + error.message)
    }
  }

  // Get creator's models
  const { data: creatorModels } = useReadContract({
    address: CONTRACT_ADDRESSES.modelRegistry,
    abi: ModelRegistryABI,
    functionName: 'getCreatorModels',
    args: [address],
    enabled: !!address,
  })

  return {
    // Registry functions
    registerModel,
    registerDerivativeModel,
    updateMetadata,
    toggleModelActive,

    // Marketplace functions
    setLicenseConfig,
    setLicensePrice,
    setRoyalty,
    addVariation,
    toggleVariationActive,
    setMaxSupply,
    toggleForSale,

    // Data
    creatorModels,
  }
}