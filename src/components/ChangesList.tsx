import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ValueChange } from '@/types/transaction'
import { Coins, Banknote, Image, Package } from 'lucide-react'
import { useState } from 'react'

interface ChangesListProps {
  title: string
  changes: ValueChange[]
}

const ChangesList: React.FC<ChangesListProps> = ({ title, changes }) => {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)

  if (changes.length === 0) return null

  const getChangeColor = (amount: string) => {
    return amount.startsWith('-') ? 'text-red-500' : 'text-green-500'
  }

  const getTypeIcon = (type: ValueChange['type']) => {
    switch (type) {
      case 'eth':
        return <Coins className="w-4 h-4 text-blue-500" />
      case 'token':
        return <Banknote className="w-4 h-4 text-green-500" />
      case 'nft':
        return <Image className="w-4 h-4 text-purple-500" />
      case 'erc1155':
        return <Package className="w-4 h-4 text-orange-500" />
    }
  }

  const getTypeName = (type: ValueChange['type']) => {
    switch (type) {
      case 'eth':
        return 'ETH'
      case 'token':
        return 'Token'
      case 'nft':
        return 'NFT (ERC721)'
      case 'erc1155':
        return 'NFT (ERC1155)'
    }
  }

  const handleAddressClick = (address: string) => {
    setSelectedAddress(selectedAddress === address ? null : address)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <ul className="space-y-2 text-sm whitespace-nowrap">
            {changes.map((change, index) => (
              <li key={index} className="flex items-center gap-2">
                {getTypeIcon(change.type)}
                <span className="font-medium">{getTypeName(change.type)}:</span>
                <span
                  className={`cursor-pointer ${
                    selectedAddress === change.address ? 'bg-yellow-200' : ''
                  }`}
                  onClick={() => handleAddressClick(change.address)}
                >
                  {change.address}
                </span>
                <span className={getChangeColor(change.amount)}>
                  {change.amount} {change.type === 'eth' ? 'ETH' : ''}
                </span>
                {change.usdValue && (
                  <span className={getChangeColor(change.usdValue)}>
                    ({change.usdValue})
                  </span>
                )}
                {change.description && (
                  <span className="text-gray-500">({change.description})</span>
                )}
                {(change.type === 'token' || change.type === 'nft' || change.type === 'erc1155') && (
                  <>
                    <span className="text-gray-500">Contract:</span>
                    <span
                      className={`cursor-pointer ${
                        selectedAddress === (change.type === 'token' ? change.token : change.contractAddress)
                          ? 'bg-yellow-200'
                          : ''
                      }`}
                      onClick={() =>
                        handleAddressClick(change.type === 'token' ? change.token : change.contractAddress)
                      }
                    >
                      {change.type === 'token' ? change.token : change.contractAddress}
                    </span>
                  </>
                )}
                {(change.type === 'nft' || change.type === 'erc1155') && (
                  <span className="text-gray-500">ID: {change.tokenId}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export default ChangesList