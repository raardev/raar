import { cn } from "@/lib/utils";
import type React from "react";

interface JsonViewProps {
	data: any;
	className?: string;
}

const JsonView: React.FC<JsonViewProps> = ({ data, className }) => {
	const formatValue = (value: any): string => {
		if (typeof value === "string") {
			return `"${value}"`;
		}
		return JSON.stringify(value);
	};

	const renderJson = (obj: any, indent = 0): JSX.Element[] => {
		return Object.entries(obj).map(([key, value], index) => {
			const isLast = index === Object.entries(obj).length - 1;
			if (typeof value === "object" && value !== null) {
				return (
					<div key={key} style={{ marginLeft: `${indent * 20}px` }}>
						<span className="text-blue-500">{`"${key}": `}</span>
						{Array.isArray(value) ? "[" : "{"}
						<div>{renderJson(value, indent + 1)}</div>
						<div style={{ marginLeft: `${indent * 20}px` }}>
							{Array.isArray(value) ? "]" : "}"}
							{!isLast && ","}
						</div>
					</div>
				);
			}
			return (
				<div key={key} style={{ marginLeft: `${indent * 20}px` }}>
					<span className="text-blue-500">{`"${key}": `}</span>
					<span className="text-green-500">{formatValue(value)}</span>
					{!isLast && ","}
				</div>
			);
		});
	};

	return (
		<pre className={cn("text-sm overflow-auto", className)}>
			{"{"}
			{renderJson(data)}
			{"}"}
		</pre>
	);
};

export default JsonView;
