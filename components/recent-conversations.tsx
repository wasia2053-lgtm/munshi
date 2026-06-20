"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { MessageCircleIcon, ArrowRightIcon } from "lucide-react";

type Conversation = {
	id: string;
	customer: string;
	lastMessage: string;
	time: string | null;
};

function formatTimeAgo(timestamp: string | null): string {
	if (!timestamp) return "—";
	const diff = Date.now() - new Date(timestamp).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "Just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.floor(hours / 24)}d ago`;
}

export function RecentConversations({
	className,
	...props
}: ComponentProps<typeof Card>) {
	const [rows, setRows] = useState<Conversation[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch('/api/dashboard/stats', { credentials: 'include' })
			.then(res => res.json())
			.then(data => {
				const conversations = (data.recentConversations || []).map((c: any) => ({
					id: c.id,
					customer: c.name,
					lastMessage: c.lastMessage,
					time: c.time,
				}));
				setRows(conversations);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	return (
		<Card
			className={cn("gap-0 shadow-none md:col-span-2 dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="border-b">
				<CardTitle>Recent conversations</CardTitle>
				<CardDescription>Latest threads from WhatsApp</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				{loading ? (
					<div className="p-6 space-y-3">
						{[1, 2, 3, 4].map(i => (
							<div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
						))}
					</div>
				) : rows.length === 0 ? (
					<div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
						No conversations yet
					</div>
				) : (
					<>
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-6">Customer</TableHead>
									<TableHead className="hidden sm:table-cell">Last Message</TableHead>
									<TableHead>Channel</TableHead>
									<TableHead className="pr-6 text-right">Time</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((r) => (
									<TableRow
										className="h-14 hover:bg-transparent"
										key={r.id}
									>
										<TableCell className="max-w-36 truncate pl-6 font-medium">
											{r.customer}
										</TableCell>
										<TableCell className="hidden max-w-32 sm:table-cell">
											<span className="line-clamp-1 text-muted-foreground text-sm">
												{r.lastMessage || '—'}
											</span>
										</TableCell>
										<TableCell>
											<span className="inline-flex items-center gap-2 font-medium text-sm">
												<MessageCircleIcon className="size-3.5 shrink-0" />
												WhatsApp
											</span>
										</TableCell>
										<TableCell className="pr-6 text-right text-muted-foreground text-sm">
											{formatTimeAgo(r.time)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						<div className="flex justify-center border-t py-3">
							<Button asChild size="sm" variant="ghost">
								<a href="/dashboard/conversations">
									View all conversations
									<ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
								</a>
							</Button>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}