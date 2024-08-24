import ChainList from '@/components/ChainList'
import ContractInteraction from '@/components/ContractInteraction'
import ContractMap from '@/components/ContractMap'
import DevnetTool from '@/components/DevnetTool'
import EthereumUnitConverter from '@/components/EthereumUnitConverter'
import FourBytes from '@/components/FourBytes'
import MultiChainGasTracker from '@/components/MultiChainGasTracker'
import RPCTool from '@/components/RPCTool'
import Sidebar from '@/components/Sidebar'
import TransactionTracer from '@/components/TransactionTracer'
import WalletGenerator from '@/components/WalletGenerator'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'
import {
  CalculatorIcon,
  FileTextIcon,
  GaugeIcon,
  GitBranchIcon,
  HashIcon,
  ListIcon,
  SearchXIcon,
  ServerIcon,
  WalletIcon,
  ZapIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { mainnet } from 'viem/chains'
import { WagmiProvider, createConfig } from 'wagmi'
import './App.css'

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [mainnet],

    // Required API Keys
    walletConnectProjectId: '927b0f2c5d6fdad04dac586d85e10cee', // raar.dev

    // Required App Info
    appName: 'RaaR',

    // Optional App Info
    appDescription: 'Your App Description',
    appUrl: 'https://raar.dev',
    appIcon: 'https://raar.dev/logo.png', // your app's icon, no bigger than 1024x1024px (max. 1MB)
  }),
)

const sidebarItems = [
  { id: 'rpcTool', label: 'RPC Tool', icon: ZapIcon },
  { id: 'chainList', label: 'Chain List', icon: ListIcon },
  { id: 'walletGenerator', label: 'Wallet Generator', icon: WalletIcon },
  { id: 'ethUnitConverter', label: 'ETH Unit Converter', icon: CalculatorIcon },
  { id: 'devnetTool', label: 'Devnet Tool', icon: ServerIcon },
  {
    id: 'contractInteraction',
    label: 'Contract Interaction',
    icon: FileTextIcon,
  },
  { id: 'fourBytes', label: '4bytes Tool', icon: HashIcon },
  { id: 'contractMap', label: 'Contract Map', icon: GitBranchIcon },
  { id: 'multiChainGasTracker', label: 'Gas Tracker', icon: GaugeIcon },
  { id: 'transactionTracer', label: 'Transaction Tracer', icon: SearchXIcon },
]

const queryClient = new QueryClient()

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'rpcTool'
  })

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab)
  }, [activeTab])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <TooltipProvider>
            <div className="flex h-screen bg-background">
              <Sidebar
                items={sidebarItems}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />

              <div className="flex-1 p-4 overflow-auto">
                <RPCTool
                  style={{
                    display: activeTab === 'rpcTool' ? 'block' : 'none',
                  }}
                />
                {activeTab === 'chainList' && <ChainList />}
                {activeTab === 'walletGenerator' && <WalletGenerator />}
                {activeTab === 'ethUnitConverter' && <EthereumUnitConverter />}
                {activeTab === 'devnetTool' && <DevnetTool />}
                {activeTab === 'contractInteraction' && <ContractInteraction />}
                {activeTab === 'fourBytes' && <FourBytes />}
                {activeTab === 'contractMap' && <ContractMap />}
                {activeTab === 'multiChainGasTracker' && (
                  <MultiChainGasTracker />
                )}
                {activeTab === 'transactionTracer' && <TransactionTracer />}
              </div>
              <Toaster />
            </div>
          </TooltipProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
