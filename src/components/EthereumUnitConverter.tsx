import { Input } from '@/components/ui/input'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { useState } from 'react'
import { formatUnits, parseUnits } from 'viem'

const units = [
  'Wei',
  'KWei',
  'MWei',
  'GWei',
  'Szabo',
  'Finney',
  'Ether',
  'KEther',
  'MEther',
  'GEther',
  'TEther',
]

const unitDecimals: Record<string, number> = {
  Wei: 0,
  KWei: 3,
  MWei: 6,
  GWei: 9,
  Szabo: 12,
  Finney: 15,
  Ether: 18,
  KEther: 21,
  MEther: 24,
  GEther: 27,
  TEther: 30,
}

const EthereumUnitConverter: React.FC = () => {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(units.map((unit) => [unit, ''])),
  )
  const [copiedUnit, setCopiedUnit] = useState<string | null>(null)

  const handleInputChange = (unit: string, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setValues((prevValues) => {
        const newValues = { ...prevValues, [unit]: value }

        if (value !== '') {
          try {
            // Convert input to wei
            const weiValue = parseUnits(value, unitDecimals[unit])

            // Convert wei to all other units
            units.forEach((u) => {
              if (u !== unit) {
                newValues[u] = formatUnits(weiValue, unitDecimals[u])
              }
            })
          } catch (error) {
            console.error('Conversion error:', error)
          }
        } else {
          units.forEach((u) => {
            if (u !== unit) {
              newValues[u] = ''
            }
          })
        }

        return newValues
      })
    }
  }

  const copyToClipboard = (unit: string, value: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopiedUnit(unit)
        setTimeout(() => setCopiedUnit(null), 2000) // Reset after 2 seconds
      })
      .catch((err) => {
        console.error('Failed to copy: ', err)
      })
  }

  return (
    <div className="container space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Ethereum Unit Converter</h2>
      <div className="space-y-4">
        {units.map((unit) => (
          <div key={unit} className="flex items-center space-x-3">
            <div className="flex-grow relative">
              <Input
                type="text"
                value={values[unit]}
                onChange={(e) => handleInputChange(unit, e.target.value)}
                placeholder={`Enter ${unit}`}
                className="pr-10"
              />
              <button
                onClick={() => copyToClipboard(unit, values[unit])}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {copiedUnit === unit ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <CopyIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="w-32 text-left">
              <span className="text-gray-600 font-medium">{unit}</span>
              <span className="text-sm text-gray-500 ml-1">{`(10^${unitDecimals[unit]})`}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EthereumUnitConverter
