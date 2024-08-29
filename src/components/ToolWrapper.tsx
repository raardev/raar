import type React from 'react'

interface ToolWrapperProps {
  title: string
  children: React.ReactNode
}

const ToolWrapper: React.FC<ToolWrapperProps> = ({ title, children }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default ToolWrapper
