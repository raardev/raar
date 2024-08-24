import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CopyableShortText from './CopyableShortText'
import { TransactionInfo } from '@/types/transaction'

interface TransactionInfoCardProps {
  transactionInfo: TransactionInfo
}

const TransactionInfoCard: React.FC<TransactionInfoCardProps> = ({ transactionInfo }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">Transaction Info</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {Object.entries(transactionInfo).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
            {typeof value === 'string' && (key === 'hash' || key === 'blockHash') ? (
              <CopyableShortText text={value} maxLength={16} />
            ) : typeof value === 'string' && value.startsWith('0x') ? (
              <CopyableShortText text={value} fullText={true} />
            ) : (
              <span className="text-gray-700 break-all">{value}</span>
            )}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

export default TransactionInfoCard