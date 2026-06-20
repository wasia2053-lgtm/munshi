"use client"

import { useState } from "react";
import { ChannelBreakdownChart } from "@/components/channel-breakdown-chart";
import { ConversationVolumeChart } from "@/components/conversation-volume-chart";
import { CsatResponsesChart } from "@/components/csat-responses-chart";
import { FirstReplyTimeChart } from "@/components/first-reply-time-chart";
import { RecentConversations } from "@/components/recent-conversations";
import { DashboardStats } from "@/components/stats";
import { SupportActivity } from "@/components/support-activity";
import { TeamOnDuty } from "@/components/team-on-duty";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export type RangeOption = "7" | "30" | "60" | "180" | "365" | "all";

export function Dashboard() {
	const [range, setRange] = useState<RangeOption>("30");

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Dashboard</h2>
					<p className="text-sm text-muted-foreground">
						Showing data for the selected time range
					</p>
				</div>
				<Select
					onValueChange={(v) => setRange(v as RangeOption)}
					value={range}
				>
					<SelectTrigger aria-label="Dashboard time range" className="w-fit" size="sm">
						<SelectValue placeholder="Range" />
					</SelectTrigger>
					<SelectContent align="end">
						<SelectItem value="7">Last 7 days</SelectItem>
						<SelectItem value="30">Last 30 days</SelectItem>
						<SelectItem value="60">Last 60 days</SelectItem>
						<SelectItem value="180">Last 6 months</SelectItem>
						<SelectItem value="365">Last 1 year</SelectItem>
						<SelectItem value="all">All time</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<DashboardStats range={range} />
				<ConversationVolumeChart range={range} />
				<ChannelBreakdownChart />
				<CsatResponsesChart range={range} />
				<FirstReplyTimeChart range={range} />
				<TeamOnDuty />
				<RecentConversations />
				<SupportActivity />
			</div>
		</div>
	);
}