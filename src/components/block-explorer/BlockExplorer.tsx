import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRightLeftIcon,
  BlocksIcon,
  InfoIcon,
  WalletIcon,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import AddressView from './AddressView'
import BlockView from './BlockView'
import NetworkInfo from './NetworkInfo'
import SearchBar from './SearchBar'
import TransactionList from './TransactionList'
import TransactionView from './TransactionView'
import { createExtendedClient } from './extended-client'

const BlockExplorer: React.FC = () => {
  const [rpcUrl, setRpcUrl] = useState('http://localhost:8545')
  const [client, setClient] = useState(() => createExtendedClient(rpcUrl))
  const [searchTerm, setSearchTerm] = useState('')
  const [currentView, setCurrentView] = useState<
    | 'network'
    | 'block'
    | 'address'
    | 'transaction'
    | 'transactions'
    | 'addressTransactions'
  >('network')
  const [currentData, setCurrentData] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdatingRPC, setIsUpdatingRPC] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateRpcConfig = useCallback(async () => {
    setIsUpdatingRPC(true)
    try {
      const newClient = createExtendedClient(rpcUrl)
      setClient(newClient)
      toast.success('RPC updated successfully')
      setCurrentView('network')
    } catch (error) {
      console.error('Error updating RPC:', error)
      toast.error('Failed to update RPC')
    } finally {
      setIsUpdatingRPC(false)
    }
  }, [rpcUrl])

  const { data: networkInfo } = useQuery({
    queryKey: ['networkInfo', rpcUrl],
    queryFn: async () => {
      const [clientVersion, chainId, latestBlock] = await Promise.all([
        client.request({ method: 'web3_clientVersion' }),
        client.getChainId(),
        client.getBlock({ blockTag: 'latest' }),
      ])
      return {
        clientVersion,
        chainId,
        latestBlockNumber: latestBlock.number.toString(),
        latestBlockTime: new Date(
          Number(latestBlock.timestamp) * 1000,
        ).toLocaleString(),
      }
    },
    refetchInterval: 10000,
  })

  const handleSearch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (searchTerm.startsWith('0x') && searchTerm.length === 66) {
        // Assume it's a transaction hash
        const tx = await client.getTransaction({
          hash: searchTerm as `0x${string}`,
        })
        if (tx) {
          setCurrentData(tx)
          setCurrentView('transaction')
        } else {
          throw new Error('Transaction not found')
        }
      } else if (searchTerm.startsWith('0x') && searchTerm.length === 42) {
        // Assume it's an address
        const addressInfo = await client.getAddressInfo({
          address: searchTerm as `0x${string}`,
        })
        setCurrentData(addressInfo)
        setCurrentView('address')
      } else {
        // Assume it's a block number
        const blockNumber = BigInt(searchTerm)
        const blockDetails = await client.getBlockDetails({ blockNumber })
        setCurrentData(blockDetails)
        setCurrentView('block')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to fetch data. Please check your input and try again.')
      toast.error('Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, client])

  const renderContent = useMemo(() => {
    switch (currentView) {
      case 'network':
        return <NetworkInfo data={networkInfo} />
      case 'block':
        return (
          <BlockView
            data={currentData}
            onViewTransactions={(blockNumber) => {
              setCurrentView('transactions')
              setCurrentPage(1)
              // Fetch transactions for the block
            }}
          />
        )
      case 'address':
        return (
          <AddressView
            data={currentData}
            searchTerm={searchTerm}
            setCurrentView={setCurrentView}
            setCurrentPage={setCurrentPage}
          />
        )
      case 'transaction':
        return <TransactionView data={currentData} searchTerm={searchTerm} />
      case 'transactions':
      case 'addressTransactions':
        return (
          <TransactionList
            data={currentData}
            currentView={currentView}
            searchTerm={searchTerm}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        )
      default:
        return null
    }
  }, [currentView, currentData, networkInfo, searchTerm, currentPage])

  return (
    <div className="space-y-4">
      <SearchBar
        rpcUrl={rpcUrl}
        setRpcUrl={setRpcUrl}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        updateRpcConfig={updateRpcConfig}
        isLoading={isLoading}
        isUpdatingRPC={isUpdatingRPC}
      />

      {error && <div className="text-red-500 mt-2">{error}</div>}

      <Tabs
        value={currentView}
        onValueChange={(value) => setCurrentView(value as any)}
      >
        <TabsList>
          <TabsTrigger value="network">
            <InfoIcon className="w-4 h-4 mr-2" />
            Network
          </TabsTrigger>
          <TabsTrigger value="block">
            <BlocksIcon className="w-4 h-4 mr-2" />
            Block
          </TabsTrigger>
          <TabsTrigger value="address">
            <WalletIcon className="w-4 h-4 mr-2" />
            Address
          </TabsTrigger>
          <TabsTrigger value="transaction">
            <ArrowRightLeftIcon className="w-4 h-4 mr-2" />
            Transaction
          </TabsTrigger>
        </TabsList>
        <TabsContent value={currentView}>{renderContent}</TabsContent>
      </Tabs>
    </div>
  )
}

export default BlockExplorer
