"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserIcon, BellIcon, LifeBuoyIcon, CreditCardIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";

interface UserInfo {
	name: string;
	email: string;
	avatar: string | null;
}

export function NavUser() {
	const [user, setUser] = useState<UserInfo | null>(null);
	const router = useRouter();
	const supabase = createClient();

	useEffect(() => {
		async function loadUser() {
			const { data: { user: authUser } } = await supabase.auth.getUser();
			if (!authUser) return;

			const { data: settings } = await supabase
				.from('business_settings')
				.select('organization_name, avatar_url')
				.eq('business_id', authUser.id)
				.single();

			setUser({
				name: settings?.organization_name || authUser.email?.split('@')[0] || 'User',
				email: authUser.email || '',
				avatar: settings?.avatar_url || null,
			});
		}
		loadUser();
	}, []);

	async function handleLogout() {
		await supabase.auth.signOut();
		router.push('/auth/login');
	}

	if (!user) {
		return <div className="size-8 rounded-full bg-white/5 animate-pulse" />;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Avatar className="size-8 cursor-pointer">
					{user.avatar && <AvatarImage src={user.avatar} />}
					<AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-60">
				<DropdownMenuItem className="flex items-center justify-start gap-2">
					<DropdownMenuLabel className="flex items-center gap-3">
						<Avatar className="size-10">
							{user.avatar && <AvatarImage src={user.avatar} />}
							<AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
						</Avatar>
						<div>
							<span className="font-medium text-foreground">{user.name}</span>{" "}
							<br />
							<div className="max-w-full overflow-hidden overflow-ellipsis whitespace-nowrap text-muted-foreground text-xs">
								{user.email}
							</div>
						</div>
					</DropdownMenuLabel>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild>
						<Link href="/dashboard/account">
							<UserIcon />
							Profile
						</Link>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild>
						<Link href="/dashboard/notifications">
							<BellIcon />
							Notifications
						</Link>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild>
						<Link href="/help">
							<LifeBuoyIcon />
							Help center
						</Link>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild>
						<Link href="/dashboard/billing">
							<CreditCardIcon />
							Subscription
						</Link>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						className="w-full cursor-pointer"
						onClick={handleLogout}
						variant="destructive"
					>
						<LogOutIcon />
						Log out
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}