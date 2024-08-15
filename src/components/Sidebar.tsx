import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface SidebarItem {
	id: string;
	label: string;
	icon: React.ElementType;
}

interface SidebarProps {
	items: SidebarItem[];
	activeTab: string;
	setActiveTab: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
	items,
	activeTab,
	setActiveTab,
}) => {
	const [collapsed, setCollapsed] = useState(false);

	return (
		<div
			className={`bg-card text-card-foreground p-4 transition-all duration-300 ${
				collapsed ? "w-16" : "w-64"
			}`}
		>
			<div className="flex justify-between items-center mb-6">
				{!collapsed && <h1 className="text-2xl font-bold">Dev Dashboard</h1>}
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setCollapsed(!collapsed)}
				>
					{collapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
				</Button>
			</div>
			<div className="space-y-2">
				{items.map((item) => (
					<Button
						key={item.id}
						variant={activeTab === item.id ? "default" : "ghost"}
						className={`w-full justify-start ${collapsed ? "px-2" : "px-4"}`}
						onClick={() => setActiveTab(item.id)}
					>
						<item.icon size={24} className={collapsed ? "mr-0" : "mr-2"} />
						{!collapsed && <span>{item.label}</span>}
					</Button>
				))}
			</div>
		</div>
	);
};

export default Sidebar;
