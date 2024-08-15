import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveAs } from 'file-saver'
import { useState } from 'react'
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
  privateKey: string
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

const WalletManagement: React.FC = () => {
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
          privateKey: account.privateKey,
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
  }

  const exportWallets = () => {
    const selectedWallets = wallets.filter((w) => w.selected)
    const headers =
      generationMethod === 'mnemonic'
        ? 'Address,Private Key,Mnemonic\n'
        : 'Address,Private Key\n'

    const csvContent =
      headers +
      selectedWallets
        .map((w) =>
          generationMethod === 'mnemonic'
            ? `${w.address},${w.privateKey},"${w.mnemonic}"`
            : `${w.address},${w.privateKey}`,
        )
        .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, 'wallets.csv')
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
      <h2 className="text-2xl font-bold mb-4">Wallet Management</h2>
      <div className="flex space-x-2">
        <Input
          type="number"
          min="1"
          value={batchSize}
          onChange={(e) => setBatchSize(Number(e.target.value))}
          placeholder="Batch size"
        />
        <select
          value={generationMethod}
          onChange={(e) =>
            setGenerationMethod(e.target.value as 'mnemonic' | 'privateKey')
          }
          className="border rounded px-2 py-1"
        >
          <option value="mnemonic">Mnemonic</option>
          <option value="privateKey">Private Key</option>
        </select>
        {generationMethod === 'mnemonic' && (
          <select
            value={selectedWordlist}
            onChange={(e) =>
              setSelectedWordlist(e.target.value as keyof typeof wordlists)
            }
            className="border rounded px-2 py-1"
          >
            {Object.keys(wordlists).map((list) => (
              <option key={list} value={list}>
                {list}
              </option>
            ))}
          </select>
        )}
        <Button onClick={generateWallets}>Generate Wallets</Button>
        <Button
          onClick={exportWallets}
          disabled={wallets.filter((w) => w.selected).length === 0}
        >
          Export Selected Wallets
        </Button>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Generated Wallets</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={toggleSelectAll}
              className="mr-2"
            />
            Select All
          </label>
          {wallets.map((wallet, index) => (
            <div key={index} className="bg-muted p-2 rounded flex items-center">
              <input
                type="checkbox"
                checked={wallet.selected}
                onChange={() => toggleWalletSelection(index)}
                className="mr-2"
              />
              <div>
                <p>Address: {wallet.address}</p>
                <p>Private Key: {wallet.privateKey}</p>
                {wallet.mnemonic && <p>Mnemonic: {wallet.mnemonic}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WalletManagement
