import ChainList from '@/components/ChainList'
import RPCTool from '@/components/RPCTool'
import Sidebar from '@/components/Sidebar'
import { ListIcon, ZapIcon } from 'lucide-react'
import { useState } from 'react'
import { Toaster } from 'sonner'
import './App.css'

const sidebarItems = [
  { id: 'rpcTool', label: 'RPC Tool', icon: ZapIcon },
  { id: 'chainList', label: 'Chain List', icon: ListIcon },
  // Add more items here as you develop other features
]

function App() {
  const [activeTab, setActiveTab] = useState('rpcTool')
  const [currentMethod, setCurrentMethod] = useState('eth_blockNumber')

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        items={sidebarItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto">
        {activeTab === 'rpcTool' && (
          <RPCTool
            currentMethod={currentMethod}
            setCurrentMethod={setCurrentMethod}
          />
        )}
        {activeTab === 'chainList' && <ChainList currentMethod={currentMethod} />}
        {/* Add more components here as you develop other features */}
      </div>
      <Toaster />
    </div>
  )
}

export default App