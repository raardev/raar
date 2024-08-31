import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as parser from '@solidity-parser/parser'
import {
  Background,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import CustomNode from './CustomNode'

interface ContractFile {
  name: string
  content: string
}

interface ContractElement {
  type: 'contract' | 'library' | 'interface'
  name: string
  functions: {
    name: string
    visibility: string
    stateMutability: string
    isConstructor: boolean
  }[]
  variables: {
    name: string
    typeName: string
    visibility: string
  }[]
  inherits: string[]
  functionCalls: {
    from: string
    to: string
    toContract: string
  }[]
}

const ContractMap: React.FC = () => {
  const [address, setAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const fetchSourceCode = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `https://sourcify.dev/server/files/any/1/${address}`,
      )
      if (!response.ok) {
        throw new Error('Contract not found on Sourcify')
      }
      const data = await response.json()

      if (data.status === 'perfect' || data.status === 'partial') {
        const contractFiles = data.files.filter((file: any) =>
          file.name.endsWith('.sol'),
        )
        const contractElements = parseContractFiles(contractFiles)
        generateGraph(contractElements)
      } else {
        throw new Error('Contract not verified on Sourcify')
      }
    } catch (error: unknown) {
      console.error('Error fetching source code:', error)
      toast.error(
        error instanceof Error ? error.message : 'Error fetching source code',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const parseContractFiles = (files: ContractFile[]): ContractElement[] => {
    const elements: ContractElement[] = []
    const contractMap: { [key: string]: ContractElement } = {}

    // biome-ignore lint/complexity/noForEach: <explanation>
    files.forEach((file) => {
      try {
        const ast = parser.parse(file.content)
        parser.visit(ast, {
          ContractDefinition: (node) => {
            const element: ContractElement = {
              type: node.kind as 'contract' | 'library' | 'interface',
              name: node.name,
              functions: [],
              variables: [],
              inherits: node.baseContracts.map(
                (base) => base.baseName.namePath,
              ),
              functionCalls: [],
            }

            parser.visit(node, {
              FunctionDefinition: (funcNode) => {
                element.functions.push({
                  name: funcNode.name || 'constructor',
                  visibility: funcNode.visibility || 'internal',
                  stateMutability: funcNode.stateMutability || '',
                  isConstructor: funcNode.isConstructor,
                })

                parser.visit(funcNode, {
                  FunctionCall: (callNode) => {
                    if (callNode.expression.type === 'MemberAccess') {
                      const memberAccess = callNode.expression
                      if (memberAccess.expression.type === 'Identifier') {
                        const contractName = memberAccess.expression.name
                        element.functionCalls.push({
                          from: funcNode.name || 'constructor',
                          to: memberAccess.memberName,
                          toContract: contractName,
                        })
                      }
                    }
                  },
                })
              },
              VariableDeclaration: (varNode) => {
                if (varNode.isStateVar) {
                  let typeName = ''
                  if (varNode.typeName) {
                    parser.visit(varNode.typeName, {
                      ElementaryTypeName: (node) => {
                        typeName = node.name
                      },
                      UserDefinedTypeName: (node) => {
                        typeName = node.namePath
                      },
                    })
                  }
                  element.variables.push({
                    name: varNode.name || '',
                    typeName: typeName,
                    visibility: varNode.visibility || 'internal',
                  })
                }
              },
            })

            elements.push(element)
            contractMap[element.name] = element
          },
        })
      } catch (error) {
        console.error(`Error parsing file ${file.name}:`, error)
      }
    })

    // Filter out non-existent base contracts
    // biome-ignore lint/complexity/noForEach: <explanation>
    elements.forEach((element) => {
      element.inherits = element.inherits.filter((base) => contractMap[base])
    })

    return elements
  }

  const generateGraph = useCallback(
    (elements: ContractElement[]) => {
      const newNodes: Node[] = []
      const newEdges: Edge[] = []
      const contractNames = new Set(elements.map((e) => e.name))

      elements.forEach((element, index) => {
        const x = (index % 4) * 300
        const y = Math.floor(index / 4) * 400

        newNodes.push({
          id: element.name,
          position: { x, y },
          data: element as unknown as Record<string, unknown>,
          type: 'contractNode',
        })

        // Inheritance edges
        // biome-ignore lint/complexity/noForEach: <explanation>
        element.inherits.forEach((baseContract) => {
          if (contractNames.has(baseContract)) {
            newEdges.push({
              id: `${element.name}-inherits-${baseContract}`,
              source: element.name,
              target: baseContract,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#ff0000' },
              label: 'inherits',
            })
          }
        })

        // Function call edges
        // biome-ignore lint/complexity/noForEach: <explanation>
        element.functionCalls.forEach((call) => {
          if (contractNames.has(call.toContract)) {
            newEdges.push({
              id: `${element.name}-${call.from}-calls-${call.toContract}-${call.to}`,
              source: element.name,
              target: call.toContract,
              sourceHandle: `${element.name}-${call.from}-source`,
              targetHandle: `${call.toContract}-${call.to}-target`,
              type: 'smoothstep',
              animated: false,
              style: { stroke: '#0000ff' },
              label: 'calls',
            })
          }
        })
      })

      setNodes(newNodes)
      setEdges(newEdges)

      console.log('Nodes:', newNodes)
      console.log('Edges:', newEdges)
    },
    [setNodes, setEdges],
  )

  return (
    <div className="space-y-4">
      <Input
        placeholder="Enter contract address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <Button onClick={fetchSourceCode} disabled={isLoading}>
        {isLoading ? 'Fetching...' : 'Fetch and Map'}
      </Button>
      <div style={{ width: '100%', height: '800px', border: '1px solid #ccc' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          nodeTypes={{ contractNode: CustomNode }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  )
}

export default ContractMap
