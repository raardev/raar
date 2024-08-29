import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { save } from '@tauri-apps/api/dialog'
import { writeTextFile } from '@tauri-apps/api/fs'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  english,
  generateMnemonic,
  generatePrivateKey,
  japanese,
  korean,
  mnemonicToAccount,
  privateKeyToAccount,
  simplifiedChinese,
  spanish,
  traditionalChinese,
} from 'viem/accounts'

interface Wallet {
  address: string
  privateKey?: string
  mnemonic?: string
  selected: boolean
}

type Wordlist =
  | typeof english
  | typeof japanese
  | typeof korean
  | typeof spanish
  | typeof simplifiedChinese
  | typeof traditionalChinese

const wordlists = {
  english,
  japanese,
  korean,
  spanish,
  simplifiedChinese,
  traditionalChinese,
}

const WalletGenerator: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [batchSize, setBatchSize] = useState(1)
  const [generationMethod, setGenerationMethod] = useState<
    'mnemonic' | 'privateKey'
  >('mnemonic')
  const [selectedWordlist, setSelectedWordlist] =
    useState<keyof typeof wordlists>('english')
  const [selectAll, setSelectAll] = useState(false)

  const generateWallets = () => {
    const newWallets: Wallet[] = []
    for (let i = 0; i < batchSize; i++) {
      if (generationMethod === 'mnemonic') {
        const mnemonic = generateMnemonic(wordlists[selectedWordlist])
        const account = mnemonicToAccount(mnemonic)
        newWallets.push({
          address: account.address,
          mnemonic: mnemonic,
          selected: false,
        })
      } else {
        const privateKey = generatePrivateKey()
        const account = privateKeyToAccount(privateKey)
        newWallets.push({
          address: account.address,
          privateKey: privateKey,
          selected: false,
        })
      }
    }
    setWallets((prevWallets) => [...prevWallets, ...newWallets])
    toast.success(`${batchSize} wallet(s) generated successfully`)
  }

  const deleteWallet = (index: number) => {
    setWallets((prevWallets) => prevWallets.filter((_, i) => i !== index))
    toast.success('Wallet deleted successfully')
  }

  const deleteSelectedWallets = () => {
    setWallets((prevWallets) =>
      prevWallets.filter((wallet) => !wallet.selected),
    )
    setSelectAll(false)
    toast.success('Selected wallets deleted successfully')
  }

  const exportWallets = async () => {
    const selectedWallets = wallets.filter((w) => w.selected)
    const headers = 'Address,Private Key,Mnemonic\n'

    const csvContent =
      headers +
      selectedWallets
        .map((w) => `${w.address},${w.privateKey || ''},${w.mnemonic || ''}`)
        .join('\n')

    try {
      const filePath = await save({
        filters: [
          {
            name: 'CSV',
            extensions: ['csv'],
          },
        ],
      })

      if (filePath) {
        await writeTextFile(filePath, csvContent)
        toast.success('Wallets exported successfully')
      }
    } catch (error) {
      console.error('Failed to export wallets:', error)
      toast.error('Failed to export wallets')
    }
  }

  const toggleWalletSelection = (index: number) => {
    setWallets(
      wallets.map((wallet, i) =>
        i === index ? { ...wallet, selected: !wallet.selected } : wallet,
      ),
    )
  }

  const toggleSelectAll = () => {
    setSelectAll(!selectAll)
    setWallets(wallets.map((wallet) => ({ ...wallet, selected: !selectAll })))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="batchSize">Batch Size</Label>
            <Input
              id="batchSize"
              type="number"
              min="1"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="generationMethod">Generation Method</Label>
            <Select
              value={generationMethod}
              onValueChange={(value) =>
                setGenerationMethod(value as 'mnemonic' | 'privateKey')
              }
            >
              <SelectTrigger id="generationMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mnemonic">Mnemonic</SelectItem>
                <SelectItem value="privateKey">Private Key</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {generationMethod === 'mnemonic' && (
          <div>
            <Label htmlFor="wordlist">Wordlist</Label>
            <Select
              value={selectedWordlist}
              onValueChange={(value) =>
                setSelectedWordlist(value as keyof typeof wordlists)
              }
            >
              <SelectTrigger id="wordlist">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(wordlists).map((list) => (
                  <SelectItem key={list} value={list}>
                    {list}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button onClick={generateWallets} className="w-full">
          Generate Wallets
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Manage Wallets</h3>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="selectAll"
              checked={selectAll}
              onCheckedChange={toggleSelectAll}
            />
            <Label htmlFor="selectAll">Select All</Label>
          </div>
          <div className="space-x-2">
            <Button
              onClick={exportWallets}
              disabled={wallets.filter((w) => w.selected).length === 0}
            >
              Export
            </Button>
            <Button
              onClick={deleteSelectedWallets}
              disabled={wallets.filter((w) => w.selected).length === 0}
              variant="destructive"
            >
              Delete
            </Button>
          </div>
        </div>

        {wallets.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No wallets generated yet. Use the form above to create some.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {wallets.map((wallet, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex items-start space-x-4">
                  <Checkbox
                    checked={wallet.selected}
                    onCheckedChange={() => toggleWalletSelection(index)}
                  />
                  <div className="flex-grow">
                    <p className="font-semibold">Address: {wallet.address}</p>
                    {wallet.privateKey && (
                      <p className="text-sm text-muted-foreground truncate">
                        Private Key: {wallet.privateKey}
                      </p>
                    )}
                    {wallet.mnemonic && (
                      <p className="text-sm text-muted-foreground truncate">
                        Mnemonic: {wallet.mnemonic}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteWallet(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletGenerator
