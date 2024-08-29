import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import { toast } from 'sonner'
import { decodeFunctionData } from 'viem'
import { Badge } from './ui/badge'

interface SignatureResult {
  name: string
  filtered: boolean
}

const FourBytes: React.FC = () => {
  const [selector, setSelector] = useState('')
  const [calldata, setCalldata] = useState('')
  const [topic, setTopic] = useState('')
  const [functionSignatures, setFunctionSignatures] = useState<
    SignatureResult[] | null
  >(null)
  const [eventSignatures, setEventSignatures] = useState<
    SignatureResult[] | null
  >(null)
  const [decodedResult, setDecodedResult] = useState<SignatureResult[] | null>(
    null,
  )
  const [filterJunk, setFilterJunk] = useState(true)
  const [abi, setAbi] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const fetchSignatures = async (type: 'function' | 'event', hash: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `https://api.openchain.xyz/signature-database/v1/lookup?${type}=${hash}&filter=${filterJunk}`,
      )
      const data = await response.json()
      if (data.ok) {
        const signatures = data.result[type][hash] || []
        if (type === 'function') {
          setFunctionSignatures(signatures)
        } else {
          setEventSignatures(signatures)
        }
      } else {
        toast.error('Error fetching signatures')
      }
    } catch (error) {
      toast.error('Error fetching signatures')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFunctionSignatures = () => fetchSignatures('function', selector)
  const fetchEventSignatures = () => fetchSignatures('event', topic)

  const decodeCalldata = async () => {
    setIsLoading(true)
    try {
      const functionSelector = calldata.slice(0, 10)
      const params = `0x${calldata.slice(10)}`

      let decoded: SignatureResult[] = []

      if (abi) {
        try {
          const decodedData = decodeFunctionData({
            abi: JSON.parse(abi),
            data: calldata as `0x${string}`,
          })

          console.log('decodedData', decodedData)

          decoded = [
            {
              name: `Decoded Function: ${decodedData.functionName}`,
              filtered: false,
            },
            ...Object.entries(decodedData.args || {}).map(([key, value]) => ({
              name: `${key}: ${formatValue(value)}`,
              filtered: false,
            })),
          ]
        } catch (error) {
          console.error('Error decoding full calldata:', error)
          toast.error('Error decoding calldata. Please check your ABI.')
        }
      } else {
        decoded = [
          {
            name: `Function Selector: ${functionSelector}`,
            filtered: false,
          },
          {
            name: `Raw Parameters: ${params}`,
            filtered: false,
          },
        ]
      }

      setDecodedResult(decoded)

      // Fetch signatures after setting the decoded result
      await fetchSignatures('function', functionSelector)
    } catch (error) {
      console.error('Error decoding calldata:', error)
      toast.error(
        'Error decoding calldata. Make sure the input and ABI are valid.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Updated helper function to format values
  const formatValue = (value: unknown): string => {
    if (typeof value === 'bigint') {
      return value.toString()
    }
    if (Array.isArray(value)) {
      return `[${value.map(formatValue).join(', ')}]`
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value)
    }
    return String(value)
  }

  const demoFunctionSelectors = [
    { label: 'transfer', value: '0xa9059cbb' },
    { label: 'approve', value: '0x095ea7b3' },
    { label: 'balanceOf', value: '0x70a08231' },
  ]

  const demoCalldata = [
    {
      label: 'transfer',
      value:
        '0xa9059cbb000000000000000000000000f922074b834d0f201d1c80f5d8cbdd441b8406b800000000000000000000000000000000000000000000000029a2241af62c0000',
      abi: JSON.stringify([
        {
          inputs: [
            { name: 'recipient', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          name: 'transfer',
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ]),
    },
    {
      label: 'approve',
      value:
        '0x095ea7b3000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      abi: JSON.stringify([
        {
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          name: 'approve',
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ]),
    },
  ]

  const demoEventTopics = [
    {
      label: 'Transfer',
      value:
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    },
    {
      label: 'Approval',
      value:
        '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Checkbox
          id="filterJunk"
          checked={filterJunk}
          onCheckedChange={(checked) => setFilterJunk(checked as boolean)}
        />
        <Label htmlFor="filterJunk">Filter out junk results</Label>
      </div>
      <Tabs defaultValue="function" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="function">Function Selector</TabsTrigger>
          <TabsTrigger value="calldata">Decode Calldata</TabsTrigger>
          <TabsTrigger value="event">Event Signature</TabsTrigger>
        </TabsList>
        <TabsContent value="function">
          <Card>
            <CardHeader>
              <CardTitle>Get Function Signatures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-2">
                <Input
                  type="text"
                  value={selector}
                  onChange={(e) => setSelector(e.target.value)}
                  placeholder="Enter function selector (e.g., 0x1234abcd)"
                />
                <Button onClick={fetchFunctionSignatures} disabled={isLoading}>
                  {isLoading ? 'Fetching...' : 'Fetch'}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {demoFunctionSelectors.map((demo) => (
                  <Button
                    key={demo.value}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelector(demo.value)}
                  >
                    {demo.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          {functionSignatures && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Function Signatures</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <ul className="space-y-1">
                    {functionSignatures.map((item, index) => (
                      <li
                        key={`function-${index}`}
                        className="flex justify-between items-center py-1 px-2 hover:bg-gray-100 rounded"
                      >
                        <span className="font-mono text-sm">{item.name}</span>
                        {item.filtered && (
                          <Badge variant="secondary">Filtered</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="calldata">
          <Card>
            <CardHeader>
              <CardTitle>Decode ABI-encoded Calldata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-2">
                <Input
                  type="text"
                  value={calldata}
                  onChange={(e) => setCalldata(e.target.value)}
                  placeholder="Enter ABI-encoded calldata"
                />
                <Textarea
                  value={abi}
                  onChange={(e) => setAbi(e.target.value)}
                  placeholder="Enter ABI (optional)"
                  className="h-24"
                />
                <div className="flex flex-row gap-2 justify-between">
                  <div className="flex flex-wrap gap-2">
                    {demoCalldata.map((demo) => (
                      <Button
                        key={demo.value}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCalldata(demo.value)
                          setAbi(demo.abi)
                        }}
                      >
                        {demo.label}
                      </Button>
                    ))}
                  </div>
                  <Button onClick={decodeCalldata} disabled={isLoading}>
                    {isLoading ? 'Decoding...' : 'Decode'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {decodedResult && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Decoded Calldata</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <ul className="space-y-1">
                    {decodedResult.map((item, index) => (
                      <li
                        key={`decoded-${index}`}
                        className="flex justify-between items-center py-1 px-2 hover:bg-gray-100 rounded"
                      >
                        <span className="font-mono text-sm">{item.name}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="event">
          <Card>
            <CardHeader>
              <CardTitle>Get Event Signature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-2">
                <Input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter event topic 0"
                />
                <Button onClick={fetchEventSignatures} disabled={isLoading}>
                  {isLoading ? 'Fetching...' : 'Fetch'}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {demoEventTopics.map((demo) => (
                  <Button
                    key={demo.value}
                    variant="outline"
                    size="sm"
                    onClick={() => setTopic(demo.value)}
                  >
                    {demo.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          {eventSignatures && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Event Signatures</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <ul className="space-y-1">
                    {eventSignatures.map((item, index) => (
                      <li
                        key={`event-${index}`}
                        className="flex justify-between items-center py-1 px-2 hover:bg-gray-100 rounded"
                      >
                        <span className="font-mono text-sm">{item.name}</span>
                        {item.filtered && (
                          <Badge variant="secondary">Filtered</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default FourBytes
