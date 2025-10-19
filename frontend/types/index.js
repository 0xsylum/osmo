// License duration constants (in seconds)
export const LICENSE_DURATIONS = {
  PERPETUAL: 0,
  THIRTY_DAYS: 30 * 24 * 60 * 60,
  NINETY_DAYS: 90 * 24 * 60 * 60,
  ONE_YEAR: 365 * 24 * 60 * 60,
  TWO_YEARS: 2 * 365 * 24 * 60 * 60
}

export const LICENSE_TYPES = {
  PERSONAL: {
    name: 'Personal',
    description: 'Non-commercial use only',
    duration: LICENSE_DURATIONS.PERPETUAL,
    features: ['Personal projects', 'No redistribution', 'Non-commercial']
  },
  INDIE: {
    name: 'Indie', 
    description: 'For indie developers and small businesses',
    duration: LICENSE_DURATIONS.ONE_YEAR,
    features: ['Revenue under $100K', 'Small business use', 'Digital products']
  },
  COMMERCIAL: {
    name: 'Commercial',
    description: 'Full commercial rights for businesses',
    duration: LICENSE_DURATIONS.ONE_YEAR,
    features: ['Unlimited revenue', 'Commercial products', 'Advertising use']
  },
  ENTERPRISE: {
    name: 'Enterprise',
    description: 'For large corporations and broadcast',
    duration: LICENSE_DURATIONS.TWO_YEARS,
    features: ['Broadcast rights', 'Enterprise use', 'Priority support']
  }
}

// Utility functions for duration formatting
export const formatDuration = (seconds) => {
  if (seconds === 0) return 'Perpetual'
  
  const days = Math.floor(seconds / (24 * 60 * 60))
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)
  
  if (years > 0) return `${years} year${years > 1 ? 's' : ''}`
  if (months > 0) return `${months} month${months > 1 ? 's' : ''}`
  return `${days} day${days > 1 ? 's' : ''}`
}

export const getRemainingTime = (expiryTimestamp) => {
  if (expiryTimestamp === 0) return 'Never expires'
  
  const now = Math.floor(Date.now() / 1000)
  const remaining = expiryTimestamp - now
  
  if (remaining <= 0) return 'Expired'
  return formatDuration(remaining)
}

export const isLicenseExpired = (expiryTimestamp) => {
  if (expiryTimestamp === 0) return false // Perpetual never expires
  return Math.floor(Date.now() / 1000) > expiryTimestamp
}

 // Material variation types
export const MATERIAL_TYPES = {
  METAL: 'metal',
  PLASTIC: 'plastic', 
  GLASS: 'glass',
  WOOD: 'wood',
  FABRIC: 'fabric',
  CUSTOM: 'custom'
}

export const MATERIAL_PROPERTIES = {
  [MATERIAL_TYPES.METAL]: {
    metallic: 1.0,
    roughness: 0.3,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1
  },
  [MATERIAL_TYPES.PLASTIC]: {
    metallic: 0.0,
    roughness: 0.4,
    clearcoat: 0.2,
    clearcoatRoughness: 0.3
  },
  [MATERIAL_TYPES.GLASS]: {
    metallic: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.5
  },
  [MATERIAL_TYPES.WOOD]: {
    metallic: 0.0,
    roughness: 0.8,
    clearcoat: 0.1,
    clearcoatRoughness: 0.4
  },
  [MATERIAL_TYPES.FABRIC]: {
    metallic: 0.0,
    roughness: 0.9,
    sheen: 0.5,
    sheenRoughness: 0.3
  }
}

// Material variation structure
export const createMaterialVariation = (name, type, properties = {}, price = 0) => ({
  id: Math.random().toString(36).substr(2, 9),
  name,
  type,
  properties: { ...MATERIAL_PROPERTIES[type], ...properties },
  price,
  previewColor: getMaterialPreviewColor(type),
  enabled: true
})

const getMaterialPreviewColor = (type) => {
  const colors = {
    [MATERIAL_TYPES.METAL]: '#94a3b8', // Silver
    [MATERIAL_TYPES.PLASTIC]: '#f1f5f9', // White
    [MATERIAL_TYPES.GLASS]: '#e0f2fe', // Light blue
    [MATERIAL_TYPES.WOOD]: '#a16207', // Brown
    [MATERIAL_TYPES.FABRIC]: '#dc2626' // Red
  }
  return colors[type] || '#6b7280'
}