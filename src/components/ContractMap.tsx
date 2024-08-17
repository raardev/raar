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
  isAbstract: boolean
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
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

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
        const contractFiles = data.files.filter((file) =>
          file.name.endsWith('.sol'),
        )
        const contractElements = parseContractFiles(contractFiles)
        generateGraph(contractElements)
      } else {
        throw new Error('Contract not verified on Sourcify')
      }
    } catch (error) {
      console.error('Error fetching source code:', error)
      toast.error(error.message || 'Error fetching source code')
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
              type: node.kind,
              name: node.name,
              isAbstract: node.isAbstract,
              functions: [],
              variables: [],
              inherits: node.baseContracts.map((base) => base.baseName.name),
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
                if (varNode.stateVariable) {
                  element.variables.push({
                    name: varNode.name,
                    typeName: parser.visit(varNode.typeName, {
                      ElementaryTypeName: (node) => node.name,
                      UserDefinedTypeName: (node) => node.namePath,
                    }),
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
          data: element,
          type: 'contractNode',
        })

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

        element.functionCalls.forEach((call) => {
          if (contractNames.has(call.toContract)) {
            const targetElement = elements.find(
              (e) => e.name === call.toContract,
            )
            if (
              targetElement &&
              targetElement.functions.some((f) => f.name === call.to)
            ) {
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
          }
        })
      })

      newEdges.forEach((edge) => {
        console.log(
          `Edge: ${edge.id}, Source: ${edge.source}, Target: ${edge.target}, SourceHandle: ${edge.sourceHandle}, TargetHandle: ${edge.targetHandle}`,
        )
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
      <h2 className="text-2xl font-bold mb-4">Contract Map</h2>
      <div className="flex space-x-2">
        <Input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter contract address"
        />
        <Button onClick={fetchSourceCode} disabled={isLoading}>
          {isLoading ? 'Fetching...' : 'Fetch and Map'}
        </Button>
      </div>
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
