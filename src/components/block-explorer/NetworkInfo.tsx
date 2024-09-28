import { BlocksIcon, ClockIcon, InfoIcon, LinkIcon } from 'lucide-react'
import type React from 'react'

interface NetworkInfoProps {
  data: {
    clientVersion: string
    chainId: number
    latestBlockNumber: string
    latestBlockTime: string
  } | null
}

const NetworkInfo: React.FC<NetworkInfoProps> = ({ data }) => {
  if (!data) {
    return <div>Loading network information...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Network Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard
          icon={<InfoIcon className="w-5 h-5" />}
          label="Client Version"
          value={data.clientVersion}
        />
        <InfoCard
          icon={<LinkIcon className="w-5 h-5" />}
          label="Chain ID"
          value={data.chainId.toString()}
        />
        <InfoCard
          icon={<BlocksIcon className="w-5 h-5" />}
          label="Latest Block"
          value={data.latestBlockNumber}
        />
        <InfoCard
          icon={<ClockIcon className="w-5 h-5" />}
          label="Latest Block Time"
          value={data.latestBlockTime}
        />
      </div>
    </div>
  )
}

interface InfoCardProps {
  icon: React.ReactNode
  label: string
  value: string
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value }) => {
  return (
    <div className="bg-gray-100 p-4 rounded-lg flex items-center space-x-4">
      <div className="text-gray-600">{icon}</div>
      <div>
        <div className="text-sm font-medium text-gray-500">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  )
}

export default NetworkInfo
