import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
})

// For now, use empty arrays - replace with actual ABIs after deployment
export const ModelRegistryABI = []
export const ModelMarketplaceABI = []
export const ModelTokenABI = []
export const DerivativeRoyaltyRegistryABI = []

export const CONTRACT_ADDRESSES = {
  modelRegistry: process.env.NEXT_PUBLIC_MODEL_REGISTRY,
  modelMarketplace: process.env.NEXT_PUBLIC_MODEL_MARKETPLACE,
  modelToken: process.env.NEXT_PUBLIC_MODEL_TOKEN,
  derivativeRoyaltyRegistry: process.env.NEXT_PUBLIC_DERIVATIVE_ROYALTY_REGISTRY
}