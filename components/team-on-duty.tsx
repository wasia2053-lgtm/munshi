"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { StatusIndicator } from "@/components/indicator";
import { LanguagesIcon, MessageSquareIcon, ClockIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";

interface BotConfig {
	botName: string
	language: string
	tone: string
	onboardingComplete: boolean
	isCurrentlyOpen: boolean
}

const languageLabels: Record<string, string> = {
	english: 'English',
	roman_urdu: 'Roman Urdu',
	arabic: 'Arabic',
}

export function TeamOnDuty({
	className,
	...props
}: ComponentProps<typeof Card>) {
	const [config, setConfig] = useState<BotConfig | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetch('/api/dashboard/bot-config', { credentials: 'include' })
			.then(res => res.json())
			.then(data => {
				setConfig(data)
				setLoading(false)
			})
			.catch(() => setLoading(false))
	}, [])

	const rows = config ? [
		{
			icon: MessageSquareIcon,
			label: 'Bot Name',
			value: config.botName,
		},
		{
			icon: LanguagesIcon,
			label: 'Language',
			value: languageLabels[config.language] || config.language,
		},
		{
			icon: ClockIcon,
			label: 'Status',
			value: config.isCurrentlyOpen ? 'Within hours' : 'After hours',
			statusColor: config.isCurrentlyOpen ? 'emerald' : 'amber',
		},
	] : []

	return (
		<Card className={cn("shadow-none dark:ring-0", className)} {...props}>
			<CardHeader className="border-b">
				<CardTitle>Bot Configuration</CardTitle>
				<CardDescription>Current automation settings</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				{loading ? (
					<div className="p-3 space-y-3">
						{[1, 2, 3].map(i => (
							<div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
						))}
					</div>
				) : (
					<ul className="flex flex-col divide-y divide-border">
						{rows.map((r) => (
							<li
								className="flex items-center gap-3 p-3 first:pt-0 last:pb-0"
								key={r.label}
							>
								<div className="flex size-8 items-center justify-center rounded-full bg-muted shrink-0">
									<r.icon className="size-4 opacity-70" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-[10px] text-muted-foreground uppercase tracking-wide">
										{r.label}
									</p>
									<p className="flex items-center gap-2 font-medium text-sm">
										{r.statusColor && (
											<StatusIndicator color={r.statusColor as any} pulse={r.statusColor === 'emerald'} />
										)}
										{r.value}
									</p>
								</div>
							</li>
						))}
						<li className="p-3">
							<Link
								href="/dashboard/settings"
								className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
							>
								<SettingsIcon className="size-3.5" />
								Edit bot settings
							</Link>
						</li>
					</ul>
				)}
			</CardContent>
		</Card>
	);
}