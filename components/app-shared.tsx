import type { ReactNode } from "react";
import { LayoutGridIcon, MessageSquareTextIcon, GraduationCapIcon, BarChart3Icon, CreditCardIcon, MessagesSquareIcon, SettingsIcon, HelpCircleIcon } from "lucide-react";

export type SidebarNavItem = {
	title: string;
	path?: string;
	icon?: ReactNode;
	isActive?: boolean;
	subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
	label?: string;
	items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
	{
		items: [
			{
				title: "Overview",
				path: "/dashboard",
				icon: (
					<LayoutGridIcon />
				),
			},
		],
	},
	{
		label: "Automation",
		items: [
			{
				title: "WhatsApp",
				path: "/dashboard/whatsapp",
				icon: (
					<MessageSquareTextIcon />
				),
			},
			{
				title: "Training",
				path: "/dashboard/training",
				icon: (
					<GraduationCapIcon />
				),
			},
			{
				title: "Analytics",
				path: "/dashboard/analytics",
				icon: (
					<BarChart3Icon />
				),
			},
		],
	},
	{
		label: "Inbox",
		items: [
			{
				title: "Conversations",
				path: "/dashboard/conversations",
				icon: (
					<MessagesSquareIcon />
				),
			},
		],
	},
	{
		label: "Account",
		items: [
			{
				title: "Billing",
				path: "/dashboard/billing",
				icon: (
					<CreditCardIcon />
				),
			},
			{
				title: "Settings",
				path: "/dashboard/settings",
				icon: (
					<SettingsIcon />
				),
			},
		],
	},
];

export const footerNavLinks: SidebarNavItem[] = [
	{
		title: "Help Center",
		path: "/dashboard/help",
		icon: (
			<HelpCircleIcon />
		),
	},
];

export const navLinks: SidebarNavItem[] = [
	...navGroups.flatMap((group) =>
		group.items.flatMap((item) =>
			item.subItems?.length ? [item, ...item.subItems] : [item]
		)
	),
	...footerNavLinks,
];