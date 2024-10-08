import ChainList from '@/components/ChainList'
import ContractInteraction from '@/components/ContractInteraction'
import ContractMap from '@/components/ContractMap'
import DevnetTool from '@/components/DevnetTool'
import ErrorBoundary from '@/components/ErrorBoundary'
import EthereumUnitConverter from '@/components/EthereumUnitConverter'
import FourBytes from '@/components/FourBytes'
import MultiChainGasTracker from '@/components/MultiChainGasTracker'
import Sidebar from '@/components/Sidebar'
import ToolWrapper from '@/components/ToolWrapper'
import TransactionTracer from '@/components/TransactionTracer'
import WalletGenerator from '@/components/WalletGenerator'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'
import {
  ActivityIcon,
  BarChartIcon,
  CalculatorIcon,
  Disc3Icon,
  FileTextIcon,
  GaugeIcon,
  GitBranchIcon,
  GitCommitIcon,
  HashIcon,
  KeyIcon,
  ListIcon,
  PickaxeIcon,
  TestTube2Icon,
  WalletIcon,
  ZapIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { mainnet } from 'viem/chains'
import { WagmiProvider, createConfig } from 'wagmi'
import './App.css'
import CastTool from './components/CastTool'
import ChainAnalyzer from './components/ChainAnalyzer'
import ChainExtractor from './components/ChainExtractor'
import HexConverter from './components/HexConverter'
import KeyConverter from './components/KeyConverter'
import RPCTool from './components/RPCTool'
import TransactionPool from './components/TransactionPool'

const config = createConfig(
  getDefaultConfig({
    chains: [mainnet],
    walletConnectProjectId: '927b0f2c5d6fdad04dac586d85e10cee',
    appName: 'RaaR',
    appDescription: 'Your App Description',
    appUrl: 'https://raar.dev',
    appIcon: 'https://raar.dev/logo.png',
  }),
)

const sidebarItems = [
  { id: 'rpcClient', label: 'RPC Client', icon: ZapIcon, component: RPCTool },
  {
    id: 'transactionTracer',
    label: 'Transaction Tracer',
    icon: GitCommitIcon,
    component: TransactionTracer,
  },
  {
    id: 'transactionPool',
    label: 'Transaction Pool',
    icon: ActivityIcon,
    component: TransactionPool,
  },
  {
    id: 'chainExtractor',
    label: 'Chain Extractor',
    icon: PickaxeIcon,
    component: ChainExtractor,
  },
  {
    id: 'chainAnalyzer',
    label: 'Chain Analyzer',
    icon: BarChartIcon,
    component: ChainAnalyzer,
  },
  {
    id: 'chainList',
    label: 'Chain List',
    icon: ListIcon,
    component: ChainList,
  },
  {
    id: 'castTool',
    label: 'Cast',
    icon: Disc3Icon,
    component: CastTool,
  },
  {
    id: 'devnetTool',
    label: 'Devnet',
    icon: TestTube2Icon,
    component: DevnetTool,
  },
  {
    id: 'walletGenerator',
    label: 'Wallet Generator',
    icon: WalletIcon,
    component: WalletGenerator,
  },
  {
    id: 'ethUnitConverter',
    label: 'Unit Converter',
    icon: CalculatorIcon,
    component: EthereumUnitConverter,
  },
  {
    id: 'contractInteraction',
    label: 'Contract Interaction',
    icon: FileTextIcon,
    component: ContractInteraction,
  },
  {
    id: 'fourBytes',
    label: '4bytes Decoder',
    icon: HashIcon,
    component: FourBytes,
  },
  {
    id: 'multiChainGasTracker',
    label: 'Gas Tracker',
    icon: GaugeIcon,
    component: MultiChainGasTracker,
  },
  {
    id: 'contractMap',
    label: 'Contract Map(Experimental)',
    icon: GitBranchIcon,
    component: ContractMap,
  },
  {
    id: 'hexConverter',
    label: 'Hex Converter',
    icon: HashIcon,
    component: HexConverter,
  },
  {
    id: 'keyConverter',
    label: 'Key Converter',
    icon: KeyIcon,
    component: KeyConverter,
  },
]

const queryClient = new QueryClient()

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'rpcClient'
  })

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab)
  }, [activeTab])

  const ActiveComponent = sidebarItems.find(
    (item) => item.id === activeTab,
  )?.component

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <TooltipProvider>
            <div className="flex h-screen bg-muted">
              <Sidebar
                items={sidebarItems}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />

              <div className="flex-1 p-4 overflow-auto bg-background rounded-t-2xl mx-3 mt-3">
                {ActiveComponent && (
                  <ErrorBoundary>
                    <ToolWrapper
                      title={
                        sidebarItems.find((item) => item.id === activeTab)
                          ?.label || ''
                      }
                    >
                      <ActiveComponent />
                    </ToolWrapper>
                  </ErrorBoundary>
                )}
              </div>
              <Toaster richColors />
            </div>
          </TooltipProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
