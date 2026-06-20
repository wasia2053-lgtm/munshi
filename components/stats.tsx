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

type Stat = {
	label: string;
	value: string;
	delta: number | null;
	footnote: string;
	lowerIsBetter: boolean;
};

interface DashboardStatsData {
	totalMessagesThisMonth: number
	messagesChangePercent: number | null
	activeLeadsThisMonth: number
	avgResponseSeconds: number | null
	whatsappStatus: string
}

function formatResponseTime(seconds: number | null) {
	if (seconds === null) return '—'
	if (seconds < 60) return `${Math.round(seconds)}s`
	return `${(seconds / 60).toFixed(1)}m`
}

export function DashboardStats() {
	const [data, setData] = useState<DashboardStatsData | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetch('/api/dashboard/stats', { credentials: 'include' })
			.then(res => res.json())
			.then(json => {
				setData(json)
				setLoading(false)
			})
			.catch(() => setLoading(false))
	}, [])

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

	const stats: readonly Stat[] = [
		{
			label: "Total Messages",
			value: data.totalMessagesThisMonth.toLocaleString(),
			delta: data.messagesChangePercent,
			footnote: "this month",
			lowerIsBetter: false,
		},
		{
			label: "Active Leads",
			value: data.activeLeadsThisMonth.toLocaleString(),
			delta: null,
			footnote: "this month",
			lowerIsBetter: false,
		},
		{
			label: "Avg Response Time",
			value: formatResponseTime(data.avgResponseSeconds),
			delta: null,
			footnote: "last 30 days",
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
						{s.delta !== null ? (
							<div className="flex items-center gap-1 text-xs">
								<Delta value={s.delta}>
									<DeltaIcon />
									<DeltaValue />
								</Delta>
								<span className="text-muted-foreground">{s.footnote}</span>
							</div>
						) : (
							<span className="text-muted-foreground text-xs">{s.footnote}</span>
						)}
					</CardContent>
				</Card>
			))}
		</>
	);
}