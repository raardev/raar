import { Handle, Position } from '@xyflow/react'

const CustomNode = ({ data }) => {
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

  console.log(
    `Node ${data.name} functions:`,
    data.functions.map((f) => f.name),
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
        {data.functions.map((func, index) => (
          <div
            key={index}
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
        ))}
      </div>
      <div className="mt-2">
        <div className="font-semibold">Variables:</div>
        {data.variables.map((variable, index) => (
          <div
            key={index}
            className={`text-sm ${getVisibilityColor(variable.visibility)}`}
          >
            {variable.name}: {variable.typeName} ({variable.visibility})
          </div>
        ))}
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
