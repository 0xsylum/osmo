import React from 'react'

export const Card = ({ children, className = '', hover = false }) => {
  return (
    <div className={`
      bg-dark-card border border-dark-border rounded-xl p-6
      ${hover ? 'hover:border-accent-blue hover:shadow-xl transition-all duration-300' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}