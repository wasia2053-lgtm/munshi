"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ShieldCheckIcon, LayersIcon, WandIcon, BellIcon, MessageSquareIcon, GraduationCapIcon, ArrowRightIcon } from "lucide-react";

type NotificationItem = {
	id: string;
	title: string;
	type: string;
	created_at: string;
};

function formatTimeAgo(timestamp: string): string {
	const diff = Date.now() - new Date(timestamp).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "Just now";
	if (mins < 60) return `${mins} min ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours} hr ago`;
	return `${Math.floor(hours / 24)} days ago`;
}

function iconFor(type: string) {
	if (type === 'training') return <GraduationCapIcon />;
	if (type === 'message') return <MessageSquareIcon />;
	if (type === 'limit') return <ShieldCheckIcon />;
	return <BellIcon />;
}

export function SupportActivity({
	className,
	...props
}: ComponentProps<typeof Card>) {
	const [items, setItems] = useState<NotificationItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch('/api/dashboard/activity', { credentials: 'include' })
			.then(res => res.json())
			.then(data => {
				setItems(data.items || []);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	return (
		<Card className={cn("gap-0 shadow-none dark:ring-0", className)} {...props}>
			<CardHeader className="border-b">
				<CardTitle>Workspace activity</CardTitle>
				<CardDescription>Recent notifications</CardDescription>
			</CardHeader>
			<CardContent className="px-0">
				{loading ? (
					<div className="p-3 space-y-3">
						{[1, 2, 3].map(i => (
							<div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
						))}
					</div>
				) : items.length === 0 ? (
					<div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
						No recent activity
					</div>
				) : (
					<ul className="flex flex-col divide-y divide-border">
						{items.map((item) => (
							<li className="flex h-18 items-center gap-3 px-3" key={item.id}>
								<span
									aria-hidden="true"
									className="flex size-10 shrink-0 items-center justify-center [&_svg]:size-4"
								>
									{iconFor(item.type)}
								</span>
								<div className="min-w-0 flex-1 space-y-1">
									<p className="line-clamp-2 text-pretty text-foreground text-xs leading-snug">
										{item.title}
									</p>
									<p className="text-muted-foreground text-xs tabular-nums">
										{formatTimeAgo(item.created_at)}
									</p>
								</div>
							</li>
						))}
					</ul>
				)}
			</CardContent>
			<div className="flex items-center justify-center">
				<Button asChild size="sm" variant="ghost">
					<a href="/dashboard/notifications">
						View All
						<ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
					</a>
				</Button>
			</div>
		</Card>
	);
}