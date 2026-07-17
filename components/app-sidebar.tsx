"use client";

import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { NavGroup } from "@/components/nav-group";
import { footerNavLinks, navGroups } from "@/components/app-shared";
import { LatestChange } from "@/components/latest-change";
import { BrandLogo } from "@/components/brand-logo";

export function AppSidebar() {
	const { state, isMobile } = useSidebar();
	const showIcon = !isMobile && state === "collapsed";

	return (
		<Sidebar collapsible="icon" variant="inset">
			<SidebarHeader className={`h-14 ${showIcon ? "justify-center" : "justify-start px-2"}`}>
				<SidebarMenuButton
					asChild
					className="group-data-[collapsible=icon]:!size-auto group-data-[collapsible=icon]:!p-1"
				>
					<a href="/dashboard" className="flex items-center justify-start gap-2 overflow-visible">
						{showIcon ? (
							<BrandLogo variant="icon" height="32px" />
						) : (
							<BrandLogo variant="full" height="30px" />
						)}
					</a>
				</SidebarMenuButton>
			</SidebarHeader>
			<SidebarContent>

				{navGroups.map((group, index) => (
					<NavGroup key={`sidebar-group-${index}`} {...group} />
				))}
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu className="mt-2">
					{footerNavLinks.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								asChild
								className="text-muted-foreground"
								isActive={item.isActive}
								size="sm"
							>
								<a href={item.path}>
									{item.icon}
									<span>{item.title}</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}