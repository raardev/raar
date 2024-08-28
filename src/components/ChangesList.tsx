import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TokenInfo } from '@/types/token'
import type { ValueChange } from '@/types/transaction'
import { useState } from 'react'

interface ValueChangeWithTokenInfo extends ValueChange {
  tokenInfo?: TokenInfo
}

interface ChangesListProps {
  title: string
  changes: ValueChangeWithTokenInfo[]
}

const ChangesList: React.FC<ChangesListProps> = ({ title, changes }) => {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)

  if (changes.length === 0) return null

  const getChangeColor = (amount: string) => {
    return amount.startsWith('-') ? 'text-red-500' : 'text-green-500'
  }

  const getTypeName = (type: ValueChange['type']) => {
    switch (type) {
      case 'eth':
        return 'ETH'
      case 'token':
        return 'ERC20'
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
          <table className="w-full text-sm">
            <tbody>
              {changes.map((change, index) => (
                <tr
                  key={change.address + index}
                  className="border-b border-gray-200"
                >
                  <td className="py-2 pr-4 w-24">
                    <span className="font-medium text-gray-500">
                      [{getTypeName(change.type)}]
                    </span>
                  </td>
                  <td className="py-2 pr-4 w-44">
                    <span
                      className={`cursor-pointer ${
                        selectedAddress === change.address
                          ? 'bg-yellow-200'
                          : ''
                      }`}
                      onClick={() => handleAddressClick(change.address)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleAddressClick(change.address)
                        }
                      }}
                      tabIndex={0}
                      role="button"
                    >
                      {change.address}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className={getChangeColor(change.amount)}>
                      {change.amount}
                    </span>{' '}
                    <span className="text-gray-500">
                      {change.type === 'eth'
                        ? 'ETH'
                        : change.tokenInfo?.symbol || ''}
                    </span>
                    {change.usdValue && (
                      <span
                        className={`ml-2 ${getChangeColor(change.usdValue)}`}
                      >
                        ({change.usdValue})
                      </span>
                    )}
                    {change.description && (
                      <span className="ml-2 text-gray-500">
                        ({change.description})
                      </span>
                    )}
                  </td>
                  <td className="py-2">
                    {(change.type === 'nft' || change.type === 'erc1155') && (
                      <span className="text-gray-500">
                        ID: {change.tokenId}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default ChangesList
