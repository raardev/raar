import BlockExplorer from '@/components/BlockExplorer'
import ChainList from '@/components/ChainList'
import ContractInteraction from '@/components/ContractInteraction'
import ContractMap from '@/components/ContractMap'
import DevnetTool from '@/components/DevnetTool'
import EthereumUnitConverter from '@/components/EthereumUnitConverter'
import FourBytes from '@/components/FourBytes'
import MultiChainGasTracker from '@/components/MultiChainGasTracker'
import RPCTool from '@/components/RPCTool'
import Sidebar from '@/components/Sidebar'
import WalletManagement from '@/components/WalletManagement'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'

import {
  CalculatorIcon,
  FileTextIcon,
  GaugeIcon,
  GitBranchIcon,
  HashIcon,
  ListIcon,
  SearchIcon,
  ServerIcon,
  WalletIcon,
  ZapIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Toaster } from 'sonner'
import { mainnet } from 'viem/chains'
import { WagmiProvider, createConfig } from 'wagmi'
import './App.css'

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [mainnet],

    // Required API Keys
    walletConnectProjectId: '927b0f2c5d6fdad04dac586d85e10cee', // raybit.dev

    // Required App Info
    appName: 'RayBit',

    // Optional App Info
    appDescription: 'Your App Description',
    appUrl: 'https://raybit.dev',
    appIcon: 'https://raybit.dev/logo.png', // your app's icon, no bigger than 1024x1024px (max. 1MB)
  }),
)

const sidebarItems = [
  { id: 'rpcTool', label: 'RPC Tool', icon: ZapIcon },
  { id: 'chainList', label: 'Chain List', icon: ListIcon },
  { id: 'walletManagement', label: 'Wallet Management', icon: WalletIcon },
  { id: 'blockExplorer', label: 'Block Explorer', icon: SearchIcon },
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
]

const queryClient = new QueryClient()

function App() {
  const [activeTab, setActiveTab] = useState('rpcTool')

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <div className="flex h-screen bg-background">
            <Sidebar
              items={sidebarItems}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            <div className="flex-1 p-8 overflow-auto">
              {activeTab === 'rpcTool' && <RPCTool />}
              {activeTab === 'chainList' && <ChainList />}
              {activeTab === 'walletManagement' && <WalletManagement />}
              {activeTab === 'blockExplorer' && <BlockExplorer />}
              {activeTab === 'ethUnitConverter' && <EthereumUnitConverter />}
              {activeTab === 'devnetTool' && <DevnetTool />}
              {activeTab === 'contractInteraction' && <ContractInteraction />}
              {activeTab === 'fourBytes' && <FourBytes />}
              {activeTab === 'contractMap' && <ContractMap />}
              {activeTab === 'multiChainGasTracker' && <MultiChainGasTracker />}
            </div>
            <Toaster />
          </div>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
