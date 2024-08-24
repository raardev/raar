import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ValueChange } from '@/types/transaction'
import CopyableShortText from './CopyableShortText'

interface ChangesListProps {
  title: string
  changes: ValueChange[]
}

const ChangesList: React.FC<ChangesListProps> = ({ title, changes }) => {
  if (changes.length === 0) return null

  const getChangeColor = (amount: string) => {
    return amount.startsWith('-') ? 'text-red-500' : 'text-green-500'
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {changes.map((change, index) => (
            <li key={index} className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{change.type.toUpperCase()}:</span>
              <CopyableShortText text={change.address} fullText={true} />
              <span className={getChangeColor(change.amount)}>
                {change.amount} {change.type === 'eth' ? 'ETH' : ''}
              </span>
              <span className={getChangeColor(change.usdValue)}>
                ({change.usdValue})
              </span>
              {change.description && (
                <span className="text-gray-500">({change.description})</span>
              )}
              {change.type === 'token' && (
                <>
                  <span className="text-gray-500">Token:</span>
                  <CopyableShortText text={change.token} fullText={true} />
                </>
              )}
              {change.type === 'nft' && (
                <>
                  <span className="text-gray-500">Contract:</span>
                  <CopyableShortText text={change.contractAddress} fullText={true} />
                  <span className="text-gray-500">ID: {change.tokenId}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default ChangesList