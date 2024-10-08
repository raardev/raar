import { invoke } from '@tauri-apps/api/tauri'
import { HelpCircle, PlayIcon, XIcon } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useCastToolStore } from '../stores/castToolStore'
import RPCInput from './RPCInput'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { ScrollArea } from './ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

interface CastCommandProps {
  id: number
  name: string
  description: string
  args: string[]
  onRemove: (id: number) => void
}

const CastCommand: React.FC<CastCommandProps> = ({
  id,
  name,
  description,
  args,
  onRemove,
}) => {
  const [inputs, setInputs] = useState<string[]>(Array(args.length).fill(''))
  const [output, setOutput] = useState<string>('')

  const handleInputChange = (index: number, value: string) => {
    setInputs((prev) => {
      const newInputs = [...prev]
      newInputs[index] = value
      return newInputs
    })
  }

  const runCommand = async () => {
    try {
      const result = (await invoke('run_cast_command', {
        command: {
          cmd: name,
          args: inputs,
        },
      })) as { output: string }
      setOutput(result.output)
    } catch (error) {
      setOutput(`Error: ${error}`)
    }
  }

  return (
    <div className="w-full mb-3 border rounded-md px-3 py-2">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <h3 className="font-bold text-sm mr-1">{name}</h3>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-3 w-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{description}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" onClick={runCommand}>
            <PlayIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onRemove(id)}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {args.map((arg, index) => (
          <div key={`${id}-${arg}-${index}`}>
            <Label htmlFor={`${id}-${arg}-${index}`} className="text-xs">
              {arg}
            </Label>
            {arg.toLowerCase() === 'rpc' ? (
              <RPCInput
                value={inputs[index]}
                onChange={(value) => handleInputChange(index, value)}
                placeholder={`Enter ${arg}`}
                className="h-6 text-xs"
              />
            ) : (
              <Input
                id={`${id}-${arg}-${index}`}
                value={inputs[index]}
                onChange={(e) => handleInputChange(index, e.target.value)}
                className="h-6 text-xs"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
              />
            )}
          </div>
        ))}
      </div>
      {output && (
        <div className="mt-1">
          <Label className="text-xs">Output:</Label>
          <pre className="bg-muted p-1 rounded-md mt-1 text-xs whitespace-pre-wrap max-h-20 overflow-auto">
            {output}
          </pre>
        </div>
      )}
    </div>
  )
}

const CastTool: React.FC = () => {
  const {
    activeCommands,
    searchTerm,
    addCommand,
    removeCommand,
    clearAllCommands,
    setSearchTerm,
  } = useCastToolStore()

  const castCommands = [
    {
      name: 'max-int',
      description: 'Get the maximum integer value for a given bit size',
      args: ['bits'],
    },
    {
      name: 'min-int',
      description: 'Get the minimum integer value for a given bit size',
      args: ['bits'],
    },
    {
      name: 'max-uint',
      description:
        'Get the maximum unsigned integer value for a given bit size',
      args: ['bits'],
    },
    { name: 'address-zero', description: 'Get the zero address', args: [] },
    { name: 'hash-zero', description: 'Get the zero hash', args: [] },

    // Conversions & transformations
    {
      name: 'from-utf8',
      description: 'Convert UTF-8 text to hex',
      args: ['text'],
    },
    {
      name: 'to-ascii',
      description: 'Convert hex data to ASCII',
      args: ['hexdata'],
    },
    {
      name: 'to-utf8',
      description: 'Convert hex data to UTF-8',
      args: ['hexdata'],
    },
    {
      name: 'from-fixed-point',
      description: 'Convert from fixed point',
      args: ['value', 'decimals'],
    },
    {
      name: 'to-fixed-point',
      description: 'Convert to fixed point',
      args: ['value', 'decimals'],
    },
    {
      name: 'concat-hex',
      description: 'Concatenate hex strings',
      args: ['...hexstrings'],
    },
    {
      name: 'from-bin',
      description: 'Convert binary data to hex',
      args: ['data'],
    },
    {
      name: 'to-hex-data',
      description: 'Ensure hex data is prefixed and valid',
      args: ['data'],
    },
    {
      name: 'to-checksum-address',
      description: 'Convert an address to checksum format',
      args: ['address'],
    },
    {
      name: 'to-uint256',
      description: 'Convert a number to uint256 hex string',
      args: ['value'],
    },
    {
      name: 'to-int256',
      description: 'Convert a number to int256 hex string',
      args: ['value'],
    },
    {
      name: 'to-unit',
      description: 'Convert an ETH amount to another unit',
      args: ['value', 'unit'],
    },
    {
      name: 'from-wei',
      description: 'Convert wei to an ETH amount',
      args: ['value', 'unit'],
    },
    {
      name: 'to-wei',
      description: 'Convert an ETH amount to wei',
      args: ['value', 'unit'],
    },
    { name: 'from-rlp', description: 'Decode RLP data', args: ['data'] },
    { name: 'to-rlp', description: 'Encode RLP data', args: ['data'] },
    {
      name: 'to-hex',
      description: 'Convert a value to hex',
      args: ['value', 'base_in (optional)'],
    },
    {
      name: 'to-dec',
      description: 'Convert a value to decimal',
      args: ['value', 'base_in (optional)'],
    },
    {
      name: 'to-base',
      description: 'Convert a value to a given base',
      args: ['value', 'base_in (optional)', 'base_out'],
    },
    {
      name: 'to-bytes32',
      description: 'Convert a string to bytes32 format',
      args: ['string'],
    },
    {
      name: 'format-bytes32-string',
      description: 'Format a string to bytes32',
      args: ['string'],
    },
    {
      name: 'parse-bytes32-string',
      description: 'Parse a bytes32 to string',
      args: ['bytes'],
    },
    {
      name: 'parse-bytes32-address',
      description: 'Parse a bytes32 to address',
      args: ['bytes'],
    },

    // ABI encoding & decoding
    {
      name: 'abi-decode',
      description: 'ABI decode data',
      args: ['sig', 'data', 'input (true/false)'],
    },
    {
      name: 'abi-encode',
      description: 'ABI encode data',
      args: ['sig', 'packed (true/false)', '...args'],
    },
    {
      name: 'calldata-decode',
      description: 'Decode calldata',
      args: ['sig', 'calldata'],
    },
    {
      name: 'calldata-encode',
      description: 'Encode calldata',
      args: ['sig', '...args'],
    },

    // Misc
    {
      name: 'keccak',
      description: 'Calculate the Keccak-256 hash of a value',
      args: ['data'],
    },
    {
      name: 'hash-message',
      description: 'Hash a message according to EIP-191',
      args: ['message'],
    },
    {
      name: 'sig-event',
      description: 'Get the event signature',
      args: ['event_string'],
    },
    {
      name: 'left-shift',
      description: 'Perform a left shift operation',
      args: ['value', 'bits', 'base_in (optional)', 'base_out'],
    },
    {
      name: 'right-shift',
      description: 'Perform a right shift operation',
      args: ['value', 'bits', 'base_in (optional)', 'base_out'],
    },
    {
      name: 'disassemble',
      description: 'Disassemble bytecode',
      args: ['bytecode'],
    },
    {
      name: 'index',
      description: 'Calculate storage index',
      args: ['key_type', 'key', 'slot_number'],
    },
    {
      name: 'index-erc7201',
      description: 'Calculate ERC7201 storage index',
      args: ['id'],
    },
    {
      name: 'decode-transaction',
      description: 'Decode a signed transaction',
      args: ['tx'],
    },
    {
      name: 'decode-eof',
      description: 'Decode EOF bytecode',
      args: ['bytecode'],
    },

    // Blockchain & RPC queries
    {
      name: 'age',
      description: 'Get the age of a block',
      args: ['rpc', 'block (optional)'],
    },
    {
      name: 'balance',
      description: 'Get the balance of an account',
      args: [
        'rpc',
        'who',
        'block (optional)',
        'ether (true/false)',
        'erc20 (optional)',
      ],
    },
    {
      name: 'base-fee',
      description: 'Get the base fee of a block',
      args: ['rpc', 'block (optional)'],
    },
    {
      name: 'block',
      description: 'Get information about a block',
      args: [
        'rpc',
        'block (optional)',
        'full (true/false)',
        'field (optional)',
        'json (true/false)',
      ],
    },
    {
      name: 'block-number',
      description: 'Get the latest block number',
      args: ['rpc'],
    },
    {
      name: 'chain',
      description: 'Get the current chain',
      args: ['rpc'],
    },
    {
      name: 'chain-id',
      description: 'Get the current chain ID',
      args: ['rpc'],
    },
    {
      name: 'client',
      description: 'Get the current client version',
      args: ['rpc'],
    },
    {
      name: 'code',
      description: 'Get the bytecode of a contract',
      args: ['rpc', 'who', 'block (optional)', 'disassemble (true/false)'],
    },
    {
      name: 'codesize',
      description: 'Get the bytecode size of a contract',
      args: ['rpc', 'who', 'block (optional)'],
    },
    {
      name: 'compute-address',
      description: 'Compute the address for a given deployer and nonce',
      args: ['rpc', 'address', 'nonce (optional)'],
    },
    {
      name: 'gas-price',
      description: 'Get the current gas price',
      args: ['rpc'],
    },
    {
      name: 'implementation',
      description: 'Get the implementation address of a proxy',
      args: ['rpc', 'who', 'block (optional)'],
    },
    {
      name: 'admin',
      description: 'Get the admin address of a proxy',
      args: ['rpc', 'who', 'block (optional)'],
    },
    {
      name: 'nonce',
      description: 'Get the nonce of an account',
      args: ['rpc', 'who', 'block (optional)'],
    },
    {
      name: 'storage',
      description: "Get the raw value of a contract's storage slot",
      args: ['rpc', 'address', 'slot', 'block (optional)'],
    },
    {
      name: 'proof',
      description: 'Generate a storage proof for a given storage slot',
      args: ['rpc', 'address', 'slots', 'block (optional)'],
    },

    // Calls & transactions
    {
      name: 'receipt',
      description: 'Get the transaction receipt for a given transaction hash',
      args: [
        'rpc',
        'tx_hash',
        'field (optional)',
        'confirmations (optional)',
        'json (true/false)',
        'cast_async (true/false)',
      ],
    },

    // ENS
    {
      name: 'namehash',
      description: 'Calculate the ENS namehash of a name',
      args: ['name'],
    },
    {
      name: 'lookup-address',
      description: 'Perform an ENS reverse lookup',
      args: ['rpc', 'who', 'verify (true/false)'],
    },
    {
      name: 'resolve-name',
      description: 'Resolve an ENS name to an address',
      args: ['rpc', 'who', 'verify (true/false)'],
    },
  ]

  const commandCategories = [
    {
      name: 'Blockchain & RPC Queries',
      commands: [
        'age',
        'balance',
        'base-fee',
        'block',
        'block-number',
        'chain',
        'chain-id',
        'client',
        'code',
        'codesize',
        'compute-address',
        'gas-price',
        'implementation',
        'admin',
        'nonce',
        'storage',
        'proof',
        'receipt',
      ],
    },
    {
      name: 'Constants & Conversions',
      commands: [
        'max-int',
        'min-int',
        'max-uint',
        'address-zero',
        'hash-zero',
        'from-utf8',
        'to-ascii',
        'to-utf8',
        'from-fixed-point',
        'to-fixed-point',
        'concat-hex',
        'from-bin',
        'to-hex-data',
        'to-checksum-address',
        'to-uint256',
        'to-int256',
        'to-unit',
        'from-wei',
        'to-wei',
        'from-rlp',
        'to-rlp',
        'to-hex',
        'to-dec',
        'to-base',
        'to-bytes32',
        'format-bytes32-string',
        'parse-bytes32-string',
        'parse-bytes32-address',
      ],
    },
    {
      name: 'ABI Encoding & Decoding',
      commands: [
        'abi-decode',
        'abi-encode',
        'calldata-decode',
        'calldata-encode',
      ],
    },
    {
      name: 'ENS',
      commands: ['namehash', 'lookup-address', 'resolve-name'],
    },
    {
      name: 'Misc',
      commands: [
        'keccak',
        'hash-message',
        'sig-event',
        'left-shift',
        'right-shift',
        'disassemble',
        'index',
        'index-erc7201',
        'decode-transaction',
        'decode-eof',
      ],
    },
  ]

  return (
    <div className="flex h-full">
      <div className="w-1/3 pr-4 border-r">
        <Input
          placeholder="Search commands..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <Accordion type="multiple" className="w-full">
            {commandCategories.map((category) => (
              <AccordionItem value={category.name} key={category.name}>
                <AccordionTrigger>{category.name}</AccordionTrigger>
                <AccordionContent>
                  {category.commands
                    .filter((cmd) =>
                      cmd.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .map((cmd) => {
                      const commandConfig = castCommands.find(
                        (c) => c.name === cmd,
                      )
                      if (!commandConfig) return null
                      return (
                        <Button
                          key={cmd}
                          onClick={() => addCommand(cmd)}
                          className="w-full justify-start mb-2 text-left"
                          variant="ghost"
                        >
                          {cmd}
                        </Button>
                      )
                    })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </div>
      <div className="w-2/3 pl-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Active Commands</h2>
          <Button onClick={clearAllCommands} variant="destructive">
            Clear All
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          {activeCommands.map((cmd) => {
            const commandConfig = castCommands.find((c) => c.name === cmd.name)
            if (!commandConfig) return null
            return (
              <CastCommand
                key={cmd.id}
                id={cmd.id}
                name={cmd.name}
                description={commandConfig.description}
                args={commandConfig.args}
                onRemove={removeCommand}
              />
            )
          })}
        </ScrollArea>
      </div>
    </div>
  )
}

export default CastTool
