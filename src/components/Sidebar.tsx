import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  return (
    <div className="bg-muted text-card-foreground p-4 w-64">
      <div className="flex items-center mb-6 pl-2">
        <img
          src="/logo.svg"
          alt="raybit"
          width={32}
          height={32}
          className="mr-2"
        />
        <h1 className="text-2xl font-bold">RaaR</h1>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <Button
            key={item.id}
            variant={'ghost'}
            className={cn(
              'w-full justify-start px-2 text-left',
              activeTab === item.id && 'bg-accent',
            )}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon size={16} className="mr-2" />
            <span>{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}

export default Sidebar
