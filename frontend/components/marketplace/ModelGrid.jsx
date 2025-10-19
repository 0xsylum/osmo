import React from 'react'
import { ModelCard } from './ModelCard'

export const ModelGrid = ({ models, onModelView, onModelPurchase }) => {
  if (!models || models.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎮</div>
        <h3 className="text-xl text-gray-300 mb-2">No models found</h3>
        <p className="text-gray-400">Be the first to upload a 3D model to the marketplace!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {models.map(model => (
        <ModelCard
          key={model.id}
          model={model}
          onView={() => onModelView(model)}
          onPurchase={() => onModelPurchase(model)}
        />
      ))}
    </div>
  )
}