import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { LucideIcon } from 'lucide-react'

interface SidebarItem {
  id: string
  label: string
  icon: LucideIcon
  component: React.ComponentType
}

interface SidebarCategory {
  label: string
  items: SidebarItem[]
}

interface AppSidebarProps {
  items: SidebarCategory[]
  activeTab: string
  setActiveTab: (id: string) => void
}

export function AppSidebar({
  items,
  activeTab,
  setActiveTab,
}: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center space-x-2 px-3 py-2">
          <img src="/logo.svg" alt="RaaR" width={32} height={32} />
          <span className="text-xl font-bold">RaaR</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="pb-4">
        {items.map((category) => (
          <SidebarGroup key={category.label}>
            <SidebarGroupLabel>{category.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {category.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeTab === item.id}
                      onClick={() => setActiveTab(item.id)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}

export { SidebarProvider } from '@/components/ui/sidebar'
