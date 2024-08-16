import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'
import { toast } from 'sonner'

interface SignatureResult {
  name: string
  filtered: boolean
}

const FourBytes: React.FC = () => {
  const [selector, setSelector] = useState('')
  const [calldata, setCalldata] = useState('')
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState<SignatureResult[] | null>(null)
  const [filterJunk, setFilterJunk] = useState(true)

  const fetchSignatures = async (type: 'function' | 'event', hash: string) => {
    try {
      const response = await fetch(
        `https://api.openchain.xyz/signature-database/v1/lookup?${type}=${hash}&filter=${filterJunk}`,
      )
      const data = await response.json()
      if (data.ok) {
        const signatures = data.result[type][hash] || []
        setResult(signatures)
      } else {
        toast.error('Error fetching signatures')
      }
    } catch (error) {
      toast.error('Error fetching signatures')
    }
  }

  const fetchFunctionSignatures = () => fetchSignatures('function', selector)
  const fetchEventSignatures = () => fetchSignatures('event', topic)

  const decodeCalldata = () => {
    // This is a placeholder implementation
    const functionSelector = calldata.slice(0, 10)
    const params = calldata.slice(10)
    setResult([
      {
        name: `Decoded Calldata (placeholder): ${functionSelector}`,
        filtered: false,
      },
    ])
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
        '0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000000000000000000000000000016345785d8a0000',
    },
    {
      label: 'approve',
      value:
        '0x095ea7b3000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
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
      <h2 className="text-2xl font-bold mb-4">4bytes Tool (OpenChain API)</h2>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="filterJunk"
          checked={filterJunk}
          onCheckedChange={(checked) => setFilterJunk(checked as boolean)}
        />
        <Label htmlFor="filterJunk">Filter out junk results</Label>
      </div>
      <Tabs defaultValue="function">
        <TabsList>
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
                <Button onClick={fetchFunctionSignatures}>Fetch</Button>
              </div>
              <div className="flex space-x-2">
                {demoFunctionSelectors.map((demo) => (
                  <Button
                    key={demo.value}
                    variant="outline"
                    onClick={() => setSelector(demo.value)}
                  >
                    {demo.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calldata">
          <Card>
            <CardHeader>
              <CardTitle>Decode ABI-encoded Calldata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-2">
                <Input
                  type="text"
                  value={calldata}
                  onChange={(e) => setCalldata(e.target.value)}
                  placeholder="Enter ABI-encoded calldata"
                />
                <Button onClick={decodeCalldata}>Decode</Button>
              </div>
              <div className="flex space-x-2">
                {demoCalldata.map((demo) => (
                  <Button
                    key={demo.value}
                    variant="outline"
                    onClick={() => setCalldata(demo.value)}
                  >
                    {demo.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
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
                <Button onClick={fetchEventSignatures}>Fetch</Button>
              </div>
              <div className="flex space-x-2">
                {demoEventTopics.map((demo) => (
                  <Button
                    key={demo.value}
                    variant="outline"
                    onClick={() => setTopic(demo.value)}
                  >
                    {demo.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.map((item, index) => (
                <li key={index} className="bg-muted p-2 rounded">
                  <p>
                    <strong>Signature:</strong> {item.name}
                  </p>
                  <p>
                    <strong>Filtered:</strong> {item.filtered ? 'Yes' : 'No'}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FourBytes
