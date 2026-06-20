"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, type ComponentProps } from "react";
import { Bar, BarChart, Rectangle, XAxis } from "recharts";
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

type DayRow = {
	day: string;
	bot: number;
	customer: number;
};

const chartConfig = {
	bot: {
		label: "Bot replies",
		color: "var(--chart-1)",
	},
	customer: {
		label: "Customer messages",
		color: "var(--chart-3)",
	},
} satisfies ChartConfig;

const BAR_RADIUS = 5;

function ColumnHoverCursor(props: React.ComponentProps<typeof Rectangle>) {
	return (
		<Rectangle
			fill="var(--muted)"
			fillOpacity={0.5}
			radius={BAR_RADIUS * 2}
			stroke="none"
			{...props}
		/>
	);
}

export function CsatResponsesChart({
	className,
	...props
}: ComponentProps<typeof Card>) {
	const [chartData, setChartData] = useState<DayRow[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch('/api/dashboard/message-activity', { credentials: 'include' })
			.then(res => res.json())
			.then(data => {
				setChartData(data.rows || []);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	return (
		<Card
			className={cn("shadow-none md:col-span-2 dark:ring-0", className)}
			{...props}
		>
			<CardHeader>
				<CardTitle>Message Activity</CardTitle>
				<CardDescription>
					Bot vs customer messages per day, last 10 days.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="aspect-video w-full bg-white/5 rounded-lg animate-pulse" />
				) : (
					<ChartContainer className="aspect-video w-full" config={chartConfig}>
						<BarChart accessibilityLayer data={chartData}>
							<XAxis
								axisLine={false}
								dataKey="day"
								interval={0}
								minTickGap={8}
								tickFormatter={(value) => String(value)}
								tickLine={false}
								tickMargin={10}
							/>
							<ChartTooltip
								content={<ChartTooltipContent hideLabel />}
								cursor={<ColumnHoverCursor />}
							/>
							<Bar
								background={{
									fill: "var(--muted)",
									radius: BAR_RADIUS,
								}}
								barSize={8}
								dataKey="customer"
								fill="var(--color-customer)"
								overflow="visible"
								radius={[0, 0, BAR_RADIUS, BAR_RADIUS]}
								stackId="activity"
							/>
							<Bar
								barSize={8}
								dataKey="bot"
								fill="var(--color-bot)"
								overflow="visible"
								radius={[BAR_RADIUS, BAR_RADIUS, 0, 0]}
								stackId="activity"
							/>
						</BarChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}