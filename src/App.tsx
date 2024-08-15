import BlockExplorer from '@/components/BlockExplorer'
import ChainList from '@/components/ChainList'
import DevnetTool from '@/components/DevnetTool'
import EthereumUnitConverter from '@/components/EthereumUnitConverter'
import RPCTool from '@/components/RPCTool'
import Sidebar from '@/components/Sidebar'
import WalletManagement from '@/components/WalletManagement'
import {
  CalculatorIcon,
  ListIcon,
  SearchIcon,
  ServerIcon,
  WalletIcon,
  ZapIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Toaster } from 'sonner'
import './App.css'

const sidebarItems = [
  { id: 'rpcTool', label: 'RPC Tool', icon: ZapIcon },
  { id: 'chainList', label: 'Chain List', icon: ListIcon },
  { id: 'walletManagement', label: 'Wallet Management', icon: WalletIcon },
  { id: 'blockExplorer', label: 'Block Explorer', icon: SearchIcon },
  { id: 'ethUnitConverter', label: 'ETH Unit Converter', icon: CalculatorIcon },
  { id: 'devnetTool', label: 'Devnet Tool', icon: ServerIcon },
  // Add more items here as you develop other features
]

function App() {
  const [activeTab, setActiveTab] = useState('rpcTool')

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        items={sidebarItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto">
        {activeTab === 'rpcTool' && <RPCTool />}
        {activeTab === 'chainList' && <ChainList />}
        {activeTab === 'walletManagement' && <WalletManagement />}
        {activeTab === 'blockExplorer' && <BlockExplorer />}
        {activeTab === 'ethUnitConverter' && <EthereumUnitConverter />}
        {activeTab === 'devnetTool' && <DevnetTool />}
        {/* Add more components here as you develop other features */}
      </div>
      <Toaster />
    </div>
  )
}

export default App
