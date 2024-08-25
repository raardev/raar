import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface CallTraceNodeProps {
  node: any
  depth: number
}

const CallTraceNode: React.FC<CallTraceNodeProps> = ({ node, depth }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2)

  const toggleExpand = () => setIsExpanded(!isExpanded)

  const formatValue = (value: string) => {
    if (value.startsWith('0x')) {
      return `${value.slice(0, 6)}...${value.slice(-4)}`
    }
    return value
  }

  return (
    <div className={`ml-${depth * 4} mb-1`}>
      <div className="flex items-center space-x-2">
        {node.calls && node.calls.length > 0 ? (
          <button onClick={toggleExpand} className="focus:outline-none">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <div className="font-mono text-sm">
          <span className="text-blue-600">{formatValue(node.to)}</span>
          <span className="text-gray-500"> - </span>
          <span className="text-purple-600">{node.input.slice(0, 10)}</span>
          {node.value && node.value !== '0x0' && (
            <span className="text-green-600 ml-2">
              ({formatValue(node.value)} ETH)
            </span>
          )}
        </div>
      </div>
      {isExpanded &&
        node.calls &&
        node.calls.map((call: any, index: number) => (
          <CallTraceNode key={index} node={call} depth={depth + 1} />
        ))}
    </div>
  )
}

interface CallTraceTreeProps {
  trace: any
}

const CallTraceTree: React.FC<CallTraceTreeProps> = ({ trace }) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 overflow-x-auto">
      <CallTraceNode node={trace} depth={0} />
    </div>
  )
}

export default CallTraceTree