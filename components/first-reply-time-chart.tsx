"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, type ComponentProps } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
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
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import type { RangeOption } from "@/components/dashboard";

type ReplyRow = {
	day: string;
	minutes: number;
};

const chartConfig = {
	minutes: {
		label: "Minutes",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

function rangeLabel(range: RangeOption) {
	if (range === "all") return "all time";
	if (range === "7") return "last 7 days";
	if (range === "30") return "last 30 days";
	if (range === "60") return "last 60 days";
	if (range === "180") return "last 6 months";
	return "last 1 year";
}

export function FirstReplyTimeChart({
	range,
	className,
	...props
}: { range: RangeOption } & ComponentProps<typeof Card>) {
	const [chartRows, setChartRows] = useState<ReplyRow[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		fetch(`/api/dashboard/reply-time?days=${range}`, { credentials: 'include' })
			.then(res => res.json())
			.then(data => {
				setChartRows(data.rows || []);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [range]);

	const firstMinutes = chartRows[0]?.minutes ?? 0;
	const lastMinutes = chartRows.at(-1)?.minutes ?? firstMinutes;
	const replyImprovementPct =
		firstMinutes > 0 ? ((firstMinutes - lastMinutes) / firstMinutes) * 100 : 0;

	return (
		<Card
			className={cn("shadow-none md:col-span-2 dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="space-y-1">
				<div className="flex flex-wrap items-center gap-2">
					<CardTitle>Avg first reply time</CardTitle>
					{!loading && (
						<Delta value={replyImprovementPct} variant="badge">
							<DeltaIcon variant="trend" />
							<DeltaValue />
						</Delta>
					)}
				</div>
				<CardDescription>
					Minutes to first bot reply, {rangeLabel(range)}.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="aspect-video w-full bg-white/5 rounded-lg animate-pulse" />
				) : (
					<ChartContainer className="aspect-video w-full" config={chartConfig}>
						<LineChart
							accessibilityLayer
							data={chartRows}
							margin={{ top: 24, left: 20, right: 12, bottom: 8 }}
						>
							<CartesianGrid className="stroke-border" vertical={false} />
							<XAxis
								axisLine={false}
								dataKey="day"
								interval="preserveStartEnd"
								minTickGap={20}
								tickLine={false}
								tickMargin={8}
							/>
							<ChartTooltip
								content={<ChartTooltipContent indicator="line" />}
								cursor={false}
							/>
							<Line
								activeDot={{ r: 6 }}
								dataKey="minutes"
								dot={false}
								stroke="var(--color-minutes)"
								strokeWidth={2}
								type="natural"
								isAnimationActive={true}
								animationDuration={800}
								animationEasing="ease-out"
							/>
						</LineChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}