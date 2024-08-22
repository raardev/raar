import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PanelLeftIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SidebarItem {
  id: string
  label: string
  icon: React.ElementType
}

interface SidebarProps {
  items: SidebarItem[]
  activeTab: string
  setActiveTab: (id: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({
  items,
  activeTab,
  setActiveTab,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const macWindowHalfWidth = 840
      setIsCollapsed(window.innerWidth < macWindowHalfWidth)
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Initial check

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div
      className={cn(
        'bg-muted text-card-foreground p-4 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex items-center mb-6">
        {isCollapsed ? (
          <Button
            variant="ghost"
            className="w-full p-0"
            onClick={() => setIsCollapsed(false)}
          >
            <PanelLeftIcon size={24} />
          </Button>
        ) : (
          <>
            <img
              src="/logo.svg"
              alt="RaaR"
              width={32}
              height={32}
              className="mr-2"
            />
            <h1 className="text-2xl font-bold">RaaR</h1>
          </>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <Button
            key={item.id}
            variant={'ghost'}
            className={cn(
              'w-full justify-start px-2',
              isCollapsed ? 'p-2' : 'text-left',
              activeTab === item.id && 'bg-accent',
            )}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon
              size={isCollapsed ? 24 : 16}
              className={isCollapsed ? '' : 'mr-2'}
            />
            {!isCollapsed && <span>{item.label}</span>}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default Sidebar
