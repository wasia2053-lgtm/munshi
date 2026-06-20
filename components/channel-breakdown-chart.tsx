"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, type ComponentProps } from "react";
import { LabelList, Pie, PieChart } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
} from "@/components/ui/chart";

type StatusKey = "active" | "recent" | "inactive";

type StatusDatum = {
	channel: StatusKey;
	share: number;
	fill: string;
};

const chartConfig = {
	share: {
		label: "Share",
	},
	active: {
		label: "Active (24h)",
		color: "var(--chart-1)",
	},
	recent: {
		label: "Recent (7d)",
		color: "var(--chart-3)",
	},
	inactive: {
		label: "Inactive",
		color: "var(--chart-5)",
	},
} satisfies ChartConfig;

export function ChannelBreakdownChart({
	className,
	...props
}: ComponentProps<typeof Card>) {
	const [chartData, setChartData] = useState<StatusDatum[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch('/api/dashboard/status-breakdown', { credentials: 'include' })
			.then(res => res.json())
			.then(data => {
				const fillMap: Record<string, string> = {
					active: 'var(--color-active)',
					recent: 'var(--color-recent)',
					inactive: 'var(--color-inactive)',
				};
				const rows = (data.breakdown || []).map((b: any) => ({
					channel: b.key,
					share: b.share,
					fill: fillMap[b.key],
				}));
				setChartData(rows);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	return (
		<Card
			className={cn("flex flex-col shadow-none dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="items-center space-y-1 pb-0 sm:items-start">
				<div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
					<CardTitle>Conversation Activity</CardTitle>
				</div>
				<CardDescription>
					Breakdown of conversations by recency
				</CardDescription>
			</CardHeader>
			<CardContent className="my-auto">
				{loading ? (
					<div className="mx-auto aspect-square max-h-72 w-full bg-white/5 rounded-full animate-pulse" />
				) : chartData.every(d => d.share === 0) ? (
					<div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
						No conversations yet
					</div>
				) : (
					<ChartContainer
						className="mx-auto aspect-square max-h-72 w-full"
						config={chartConfig}
					>
						<PieChart accessibilityLayer>
							<Pie
								cornerRadius={8}
								data={chartData}
								dataKey="share"
								innerRadius={36}
								nameKey="channel"
								outerRadius="88%"
								stroke="var(--card)"
								strokeWidth={4}
							>
								<LabelList
									className="fill-background font-medium"
									dataKey="share"
									fill="currentColor"
									fontWeight={500}
									formatter={(label: any) => {
										const n = Number(label);
										return Number.isFinite(n) && n > 0 ? `${n}%` : "";
									}}
									position="inside"
									stroke="none"
								/>
							</Pie>
							<ChartLegend content={<ChartLegendContent nameKey="channel" />} />
						</PieChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}