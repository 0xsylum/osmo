import React from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '../ui/Button'
import { LogOut, Wallet } from 'lucide-react'

export const WalletConnect = () => {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-300">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <Button variant="secondary" size="sm" onClick={() => disconnect()}>
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <Button
          key={connector.uid}
          onClick={() => connect({ connector })}
          size="sm"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect {connector.name}
        </Button>
      ))}
    </div>
  )
}