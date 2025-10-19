import React, { useState } from 'react'
import Head from 'next/head'
import { WalletConnect } from '@/components/web3/WalletConnect'
import { ModelGrid } from '@/components/marketplace/ModelGrid'
import { UploadModel } from '@/components/creator/UploadModel'
import { Button } from '@/components/ui/Button'
import { Search, Filter, Upload } from 'lucide-react'

// Mock data - replace with actual data from contracts
 const MOCK_MODELS = [
  {
    id: 1,
    name: 'Industrial Robot Arm',
    description: 'Advanced industrial robotic arm with full articulation and realistic movement',
    creator: 'RoboDesign Pro',
    modelUrl: 'https://example.com/models/robot-arm.glb', // Your IPFS URL
    prices: {
      PERSONAL: 50,
      INDIE: 150,
      COMMERCIAL: 300,
      ENTERPRISE: 1000
    },
    downloadCount: 847,
    tags: ['robot', 'industrial', 'mechanical', 'animation'],
    previewEmoji: '🤖',
    materials: [
      {
        name: 'Default Metal',
        previewColor: '#6b7280',
        price: 0
      },
      {
        name: 'Gold Plated',
        previewColor: '#fbbf24', 
        price: 25,
        description: 'Premium gold finish'
      },
      {
        name: 'Carbon Fiber',
        previewColor: '#1f2937',
        price: 35,
        description: 'Lightweight carbon fiber'
      }
    ],
    technicalSpecs: {
      vertices: 45230,
      triangles: 84500,
      materials: 3,
      fileSize: '15.4 MB'
    }
  },
  // ... more models with modelUrl and materials
] 
export default function Home() {
  const [activeTab, setActiveTab] = useState('browse')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredModels = MOCK_MODELS.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleModelView = (model) => {
    // Navigate to model detail page
    console.log('View model:', model)
  }

  const handleModelPurchase = (model) => {
    // Open purchase modal
    console.log('Purchase model:', model)
  }

  const handleUploadComplete = () => {
    setActiveTab('browse')
    // Refresh models list
  }

  return (
    <>
      <Head>
        <title>3D Model Marketplace | Base Blockchain</title>
        <meta name="description" content="Discover and trade 3D models on Base Blockchain" />
      </Head>

      <div className="min-h-screen bg-dark-bg text-white">
        {/* Header */}
        <header className="border-b border-dark-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
                  3D Model Marketplace
                </h1>
                <nav className="hidden md:flex items-center gap-6">
                  <button
                    onClick={() => setActiveTab('browse')}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'browse' 
                        ? 'bg-dark-card text-accent-blue' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Browse Models
                  </button>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'upload' 
                        ? 'bg-dark-card text-accent-blue' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Upload Model
                  </button>
                </nav>
              </div>
              <WalletConnect />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {activeTab === 'browse' && (
            <>
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search models, creators, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-dark-card border border-dark-border rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:border-accent-blue focus:outline-none"
                  />
                </div>
                <Button variant="secondary">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Button onClick={() => setActiveTab('upload')}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Model
                </Button>
              </div>

              {/* Models Grid */}
              <ModelGrid
                models={filteredModels}
                onModelView={handleModelView}
                onModelPurchase={handleModelPurchase}
              />
            </>
          )}

          {activeTab === 'upload' && (
            <div className="max-w-2xl mx-auto">
              <UploadModel onUploadComplete={handleUploadComplete} />
            </div>
          )}
        </main>
      </div>
    </>
  )
}