import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface SearchBarProps {
  rpcUrl: string
  setRpcUrl: (url: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  handleSearch: () => void
  updateRpcConfig: () => void
  isLoading: boolean
  isUpdatingRPC: boolean
}

const SearchBar: React.FC<SearchBarProps> = ({
  rpcUrl,
  setRpcUrl,
  searchTerm,
  setSearchTerm,
  handleSearch,
  updateRpcConfig,
  isLoading,
  isUpdatingRPC,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="RPC URL"
          value={rpcUrl}
          onChange={(e) => setRpcUrl(e.target.value)}
          className="flex-grow"
          disabled={isUpdatingRPC}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <Button onClick={updateRpcConfig} disabled={isUpdatingRPC}>
          {isUpdatingRPC ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Update RPC
        </Button>
      </div>
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Search by Block Number / Address / Tx Hash"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Search
        </Button>
      </div>
    </div>
  )
}

export default SearchBar
