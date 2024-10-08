import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TokenInfo } from '@/types/token' // Add this import
import type { Action } from '@/types/transaction'

interface ActionWithTokenInfo extends Action {
  tokenInfo?: TokenInfo
}

interface ActionsListProps {
  title: string
  actions: ActionWithTokenInfo[]
}

const ActionsList: React.FC<ActionsListProps> = ({ title, actions }) => {
  if (actions.length === 0) return null

  const shortenAddress = (address: string) => {
    return address.startsWith('0x')
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : address
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-muted-foreground overflow-x-auto whitespace-nowrap">
          {actions.map((action, index) => (
            <li
              key={index}
              className="text-sm flex items-center space-x-2 whitespace-nowrap"
            >
              <span className="text-foreground">[{action.type}]</span>
              <span>
                amount=
                <span className="text-foreground">{action.amount}</span>
              </span>
              <span className="font-medium">
                {action.token === 'ETH'
                  ? 'ETH'
                  : action.tokenInfo?.symbol || action.tokenInfo?.address}
              </span>
              <span>
                from=
                <span className="text-foreground">{action.from}</span>
              </span>
              <span>
                to=
                <span className="text-foreground">{action.to}</span>
              </span>
              {action.operator && (
                <span>
                  operator=
                  <span className="text-foreground font-medium">
                    {shortenAddress(action.operator)}
                  </span>
                </span>
              )}
              {action.tokenId && (
                <span>
                  tokenId=
                  <span className="text-foreground font-medium">
                    {action.tokenId}
                  </span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default ActionsList
