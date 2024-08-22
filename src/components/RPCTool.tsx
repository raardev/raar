import { Button } from '@/components/ui/button'
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useRPCToolStore } from '@/stores/rpcToolStore'
import { json } from '@codemirror/lang-json'
import { writeText } from '@tauri-apps/api/clipboard'
import { save } from '@tauri-apps/api/dialog'
import { writeTextFile } from '@tauri-apps/api/fs'
import CodeMirror from '@uiw/react-codemirror'
import {
  CheckIcon,
  ComputerIcon,
  CopyIcon,
  DownloadIcon,
  FileJsonIcon,
  PlusIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

const commonMethods = [
  'eth_blockNumber',
  'eth_getBalance',
  'eth_getTransactionCount',
  'eth_getBlockByNumber',
  'eth_getTransactionByHash',
  'custom',
]

const defaultParams: Record<string, string> = {
  eth_blockNumber: JSON.stringify(
    {
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1,
    },
    null,
    2,
  ),
  eth_getBalance: JSON.stringify(
    {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'latest'],
      id: 1,
    },
    null,
    2,
  ),
  eth_getTransactionCount: JSON.stringify(
    {
      jsonrpc: '2.0',
      method: 'eth_getTransactionCount',
      params: ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'latest'],
      id: 1,
    },
    null,
    2,
  ),
  eth_getBlockByNumber: JSON.stringify(
    {
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: ['0x1b4', true],
      id: 1,
    },
    null,
    2,
  ),
  eth_getTransactionByHash: JSON.stringify(
    {
      jsonrpc: '2.0',
      method: 'eth_getTransactionByHash',
      params: [
        '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b',
      ],
      id: 1,
    },
    null,
    2,
  ),
  custom: JSON.stringify(
    {
      jsonrpc: '2.0',
      method: 'method_name',
      params: [],
      id: 1,
    },
    null,
    2,
  ),
}

const RPCTool: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { requests, activeTab, addRequest, updateRequest, setActiveTab } =
    useRPCToolStore()
  const [isLoading, setIsLoading] = useState(false)
  const [openPopover, setOpenPopover] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [convertedResponse, setConvertedResponse] = useState<string | null>(
    null,
  )

  const handleAddTab = () => {
    const newId = (
      Math.max(...requests.map((req) => Number.parseInt(req.id))) + 1
    ).toString()
    addRequest({
      id: newId,
      rpcUrl: '',
      method: 'eth_blockNumber',
      params: defaultParams.eth_blockNumber,
      response: null,
      latency: null,
    })
    setActiveTab(newId)
  }

  const handleMethodChange = useCallback(
    (id: string, method: string) => {
      updateRequest(id, {
        method,
        params: defaultParams[method],
      })
      setOpenPopover(null)
      setSearchTerm('')
    },
    [updateRequest],
  )

  const formatJson = (value: string) => {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }

  const filteredMethods = commonMethods.filter((method) =>
    method.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const validateUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch (_) {
      return false
    }
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-500'
    if (status >= 300 && status < 400) return 'text-yellow-500'
    if (status >= 400) return 'text-red-500'
    return 'text-gray-500'
  }

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'text-green-500'
    if (latency < 300) return 'text-yellow-500'
    return 'text-red-500'
  }

  const downloadJson = async (data: any) => {
    try {
      const jsonString = JSON.stringify(data, null, 2)
      const filePath = await save({
        filters: [{ name: 'JSON', extensions: ['json'] }],
      })
      if (filePath) {
        await writeTextFile(filePath, jsonString)
        toast.success('JSON file saved successfully')
      }
    } catch (error) {
      console.error('Failed to save JSON file:', error)
      toast.error('Failed to save JSON file')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await writeText(text)
      toast.success('Copied to clipboard')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const convertHexToNumber = (obj: any): any => {
    if (typeof obj === 'string' && obj.startsWith('0x')) {
      return Number.parseInt(obj, 16)
    } else if (Array.isArray(obj)) {
      return obj.map(convertHexToNumber)
    } else if (typeof obj === 'object' && obj !== null) {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key,
          convertHexToNumber(value),
        ]),
      )
    }
    return obj
  }

  const sendRequest = async (id: string) => {
    setIsLoading(true)
    const request = requests.find((req) => req.id === id)
    if (!request) return

    try {
      const startTime = Date.now()
      const parsedParams = JSON.parse(request.params)
      const res = await fetch(request.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: request.method,
          params: parsedParams.params,
        }),
      })
      const endTime = Date.now()
      const data = await res.json()
      updateRequest(id, { response: data, latency: endTime - startTime })
    } catch (error) {
      updateRequest(id, {
        response: { error: (error as Error).message },
        latency: null,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4" style={style}>
      <h2 className="text-2xl font-bold mb-4 w-full">RPC Tool</h2>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center">
          <TabsList>
            {requests.map((req) => (
              <TabsTrigger key={req.id} value={req.id}>
                Request {req.id}
              </TabsTrigger>
            ))}
            <Button
              onClick={handleAddTab}
              variant="ghost"
              size="icon"
              className="ml-2 h-8 w-8"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </TabsList>
        </div>
        {requests.map((req) => (
          <TabsContent key={req.id} value={req.id} className="space-y-4">
            <div className="flex space-x-2 items-center">
              <Input
                value={req.rpcUrl}
                onChange={(e) => {
                  const newValue = e.target.value.toLowerCase()
                  updateRequest(req.id, { rpcUrl: newValue })
                }}
                onBlur={(e) => {
                  if (!validateUrl(e.target.value)) {
                    alert('Please enter a valid URL')
                    updateRequest(req.id, { rpcUrl: '' })
                  }
                }}
                placeholder="http://localhost:8545"
                className="flex-grow bg-muted"
              />
              <Button
                onClick={() => sendRequest(req.id)}
                disabled={isLoading || !validateUrl(req.rpcUrl)}
              >
                Send
              </Button>
            </div>
            <div className="relative">
              <CodeMirror
                value={req.params}
                height="200px"
                extensions={[json()]}
                onChange={(value) => updateRequest(req.id, { params: value })}
                className="border border-input rounded-md"
              />
              <div className="absolute top-4 right-2 flex space-x-2 text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() =>
                        updateRequest(req.id, {
                          params: formatJson(req.params),
                        })
                      }
                      variant="ghost"
                      size="icon"
                      className="w-5 h-5 hover:bg-transparent"
                    >
                      <FileJsonIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Format JSON</TooltipContent>
                </Tooltip>
                <Popover
                  open={openPopover === req.id}
                  onOpenChange={(open) => setOpenPopover(open ? req.id : null)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      role="combobox"
                      size="icon"
                      aria-expanded={openPopover === req.id}
                      className="w-5 h-5 hover:bg-transparent"
                      onClick={(e) => {
                        e.preventDefault()
                        setOpenPopover(openPopover === req.id ? null : req.id)
                      }}
                    >
                      <ComputerIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search method..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                      />
                      <CommandList>
                        {filteredMethods.map((method) => (
                          <CommandItem
                            key={method}
                            onSelect={() => handleMethodChange(req.id, method)}
                          >
                            <div className="flex items-center justify-between w-full">
                              {method}
                              {req.method === method && (
                                <CheckIcon className="h-4 w-4" />
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {req.response && (
              <>
                <div className="flex items-center space-x-4 text-xs">
                  <span>
                    Status:{' '}
                    <span
                      className={`${getStatusColor(req.response.status || 200)} font-medium`}
                    >
                      {req.response.status || 200}
                    </span>{' '}
                    •{' '}
                    <span
                      className={`${getStatusColor(req.response.status || 200)} font-medium`}
                    >
                      {req.response.statusText || 'OK'}
                    </span>
                  </span>
                  <span>
                    Time:{' '}
                    <span
                      className={`${getLatencyColor(req.latency || 0)} font-medium`}
                    >
                      {req.latency || 0} ms
                    </span>
                  </span>
                  <span>
                    Size:{' '}
                    <span className="text-purple-500 font-medium">
                      {JSON.stringify(req.response).length} B
                    </span>
                  </span>
                </div>
                <div className="relative">
                  <CodeMirror
                    value={JSON.stringify(
                      convertedResponse || req.response,
                      null,
                      2,
                    )}
                    height="200px"
                    extensions={[json()]}
                    editable={false}
                    className="border border-input rounded-md"
                  />
                  <div className="absolute top-2 right-2 flex space-x-2 text-muted-foreground">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() =>
                            downloadJson(convertedResponse || req.response)
                          }
                          variant="ghost"
                          size="icon"
                          className="w-5 h-5 hover:bg-transparent"
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download JSON</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(
                                convertedResponse || req.response,
                                null,
                                2,
                              ),
                            )
                          }
                          variant="ghost"
                          size="icon"
                          className="w-5 h-5 hover:bg-transparent"
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy to Clipboard</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => {
                            if (convertedResponse) {
                              setConvertedResponse(null)
                            } else {
                              setConvertedResponse(
                                convertHexToNumber(req.response),
                              )
                            }
                          }}
                          variant="ghost"
                          size="icon"
                          className="w-5 h-5 hover:bg-transparent"
                        >
                          <RefreshCwIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Convert Hex to Number</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default RPCTool
