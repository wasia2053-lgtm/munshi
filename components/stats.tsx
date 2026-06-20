"use client"
import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import { useEffect, useState } from "react";
import type { RangeOption } from "@/components/dashboard";

type Stat = {
	label: string;
	value: string;
	delta: number | null;
	footnote: string;
	lowerIsBetter: boolean;
};

interface DashboardStatsData {
	totalMessages: number
	activeLeads: number
	avgResponseSeconds: number | null
	whatsappStatus: string
}

function formatResponseTime(seconds: number | null) {
	if (seconds === null) return '—'
	if (seconds < 60) return `${Math.round(seconds)}s`
	return `${(seconds / 60).toFixed(1)}m`
}

function rangeLabel(range: RangeOption) {
	if (range === "all") return "all time";
	if (range === "7") return "last 7 days";
	if (range === "30") return "last 30 days";
	if (range === "60") return "last 60 days";
	if (range === "180") return "last 6 months";
	return "last 1 year";
}

export function DashboardStats({ range }: { range: RangeOption }) {
	const [data, setData] = useState<DashboardStatsData | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		setLoading(true)
		fetch(`/api/dashboard/stats?range=${range}`, { credentials: 'include' })
			.then(res => res.json())
			.then(json => {
				setData(json)
				setLoading(false)
			})
			.catch(() => setLoading(false))
	}, [range])

	if (loading || !data) {
		return (
			<>
				{[1, 2, 3, 4].map(i => (
					<Card className={cn("shadow-none dark:ring-0")} key={i}>
						<CardHeader>
							<CardTitle className="font-normal text-muted-foreground text-xs">
								Loading...
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="h-8 w-16 bg-white/5 rounded animate-pulse" />
						</CardContent>
					</Card>
				))}
			</>
		)
	}

	const label = rangeLabel(range);

	const stats: readonly Stat[] = [
		{
			label: "Total Messages",
			value: data.totalMessages.toLocaleString(),
			delta: null,
			footnote: label,
			lowerIsBetter: false,
		},
		{
			label: "Active Leads",
			value: data.activeLeads.toLocaleString(),
			delta: null,
			footnote: label,
			lowerIsBetter: false,
		},
		{
			label: "Avg Response Time",
			value: formatResponseTime(data.avgResponseSeconds),
			delta: null,
			footnote: label,
			lowerIsBetter: true,
		},
		{
			label: "WhatsApp Status",
			value: data.whatsappStatus === 'connected' ? 'Connected' : 'Disconnected',
			delta: null,
			footnote: data.whatsappStatus === 'connected' ? 'live' : 'action needed',
			lowerIsBetter: false,
		},
	];

	return (
		<>
			{stats.map((s) => (
				<Card className={cn("shadow-none dark:ring-0")} key={s.label}>
					<CardHeader>
						<CardTitle className="font-normal text-muted-foreground text-xs">
							{s.label}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						<p className="font-semibold text-2xl tabular-nums">{s.value}</p>
						<span className="text-muted-foreground text-xs">{s.footnote}</span>
					</CardContent>
				</Card>
			))}
		</>
	);
}