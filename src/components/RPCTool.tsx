import { Button } from '@/components/ui/button'
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
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
import { commonMethods, defaultParams } from '@/config/rpcToolDefaults'
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
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  XIcon,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import RPCInput from './RPCInput'

interface RPCResponse {
  status?: number
  statusText?: string
  error?: string
}

const RPCTool: React.FC = () => {
  const {
    requests,
    activeTab,
    addRequest,
    updateRequest,
    setActiveTab,
    removeRequest,
  } = useRPCToolStore()

  useEffect(() => {
    if (requests.length === 0) {
      handleAddTab()
    }
  }, [requests])

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {},
  )
  const [openPopover, setOpenPopover] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [convertedResponse, setConvertedResponse] =
    useState<RPCResponse | null>(null)

  const handleAddTab = () => {
    const newId = (
      Math.max(...requests.map((req) => Number.parseInt(req.id)), 0) + 1
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

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    removeRequest(id)
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

  const filteredMethods = commonMethods.filter((rpcMethod) =>
    rpcMethod.method.toLowerCase().includes(searchTerm.toLowerCase()),
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

  const downloadJson = async (data: RPCResponse) => {
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

  const convertHexToNumber = (obj: unknown): unknown => {
    if (typeof obj === 'string' && obj.startsWith('0x')) {
      return Number.parseInt(obj, 16)
    }
    if (Array.isArray(obj)) {
      return obj.map(convertHexToNumber)
    }
    if (typeof obj === 'object' && obj !== null) {
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
    setLoadingStates((prev) => ({ ...prev, [id]: true }))
    const request = requests.find((req) => req.id === id)
    if (!request) return

    try {
      const startTime = Date.now()
      const res = await fetch(request.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: request.params, // Use the exact input from the params field
      })
      const endTime = Date.now()
      const data = await res.json()
      updateRequest(id, {
        response: data,
        latency: endTime - startTime,
        status: res.status,
        statusText: res.statusText,
      })
    } catch (error) {
      updateRequest(id, {
        response: { error: (error as Error).message },
        latency: null,
        status: 500,
        statusText: 'Request Failed',
      })
    } finally {
      setLoadingStates((prev) => ({ ...prev, [id]: false }))
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center">
          <TabsList>
            {requests.map((req) => (
              <TabsTrigger
                key={req.id}
                value={req.id}
                className="relative pr-8"
              >
                Request {req.id}
                <Button
                  onClick={(e) => handleCloseTab(e, req.id)}
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                >
                  <XIcon className="h-3 w-3" />
                </Button>
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
              <RPCInput
                value={req.rpcUrl}
                onChange={(newValue) =>
                  updateRequest(req.id, { rpcUrl: newValue })
                }
                placeholder="http://localhost:8545"
              />
              <Button
                onClick={() => sendRequest(req.id)}
                disabled={loadingStates[req.id] || !validateUrl(req.rpcUrl)}
              >
                {loadingStates[req.id] ? (
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                ) : null}
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
                        {filteredMethods.map((rpcMethod) => (
                          <CommandItem
                            key={rpcMethod.method}
                            onSelect={() =>
                              handleMethodChange(req.id, rpcMethod.method)
                            }
                          >
                            <div className="flex items-center justify-between w-full">
                              {rpcMethod.method}
                              {req.method === rpcMethod.method && (
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
                      className={`${getStatusColor(req.status || 200)} font-medium`}
                    >
                      {req.status || 200}
                    </span>{' '}
                    •{' '}
                    <span
                      className={`${getStatusColor(req.status || 200)} font-medium`}
                    >
                      {req.statusText || 'OK'}
                    </span>
                  </span>
                  {req.latency !== null && (
                    <span>
                      Time:{' '}
                      <span
                        className={`${getLatencyColor(req.latency)} font-medium`}
                      >
                        {req.latency} ms
                      </span>
                    </span>
                  )}
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
                    height="400px"
                    extensions={[json()]}
                    editable={false}
                    className="border border-input rounded-md"
                  />
                  <div className="absolute top-2 right-2 flex space-x-2 text-muted-foreground">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() =>
                            downloadJson(
                              convertedResponse ||
                                (req.response as RPCResponse),
                            )
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
                                convertHexToNumber(req.response) as RPCResponse,
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
