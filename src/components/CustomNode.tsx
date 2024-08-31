import { Handle, Position } from '@xyflow/react'

interface Function {
  name: string
  visibility: string
  stateMutability: string
  isConstructor?: boolean
}

interface Variable {
  name: string
  typeName: string
  visibility: string
}

interface NodeData {
  name: string
  type: string
  isAbstract?: boolean
  functions: Function[]
  variables: Variable[]
}

interface CustomNodeProps {
  data: NodeData
}

const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'text-green-600'
      case 'private':
        return 'text-red-600'
      case 'internal':
        return 'text-yellow-600'
      case 'external':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  // Safely log the functions, handling the case where data.functions might be undefined
  console.log(
    `Node ${data.name} functions:`,
    data.functions?.map((f: Function) => f.name) ?? 'No functions',
  )

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400 max-w-md">
      <Handle
        type="target"
        position={Position.Top}
        id={`${data.name}-target`}
      />
      <div className="font-bold text-lg">
        {data.isAbstract && <span className="text-purple-600">abstract </span>}
        {data.type} {data.name}
      </div>
      <div className="mt-2">
        <div className="font-semibold">Functions:</div>
        {data.functions && data.functions.length > 0 ? (
          data.functions.map((func: Function, index: number) => (
            <div
              key={func.name}
              className={`text-sm ${getVisibilityColor(func.visibility)}`}
            >
              {func.name}
              {func.isConstructor
                ? ' (constructor)'
                : `(${func.visibility} ${func.stateMutability})`}
              <Handle
                type="target"
                position={Position.Left}
                id={`${data.name}-${func.name}-target`}
                style={{ left: '-8px', top: `${20 + index * 24}px` }}
              />
              <Handle
                type="source"
                position={Position.Right}
                id={`${data.name}-${func.name}-source`}
                style={{ right: '-8px', top: `${20 + index * 24}px` }}
              />
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500">No functions</div>
        )}
      </div>
      <div className="mt-2">
        <div className="font-semibold">Variables:</div>
        {data.variables && data.variables.length > 0 ? (
          data.variables.map((variable: Variable) => (
            <div
              key={variable.name}
              className={`text-sm ${getVisibilityColor(variable.visibility)}`}
            >
              {variable.name}: {variable.typeName} ({variable.visibility})
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500">No variables</div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${data.name}-source`}
      />
    </div>
  )
}

export default CustomNode
