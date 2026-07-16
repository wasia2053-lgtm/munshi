import type React from "react";

/**
 * LogoIcon — the "m." icon mark (64×64 viewBox).
 * Renders the official icon.svg asset.
 * Accepts standard img props for className/style/width/height overrides.
 */
export const LogoIcon = ({
	className,
	style,
	width,
	height,
	...rest
}: React.ImgHTMLAttributes<HTMLImageElement>) => (
	<img
		src="/branding/icon.svg"
		alt="Munshi icon"
		width={width ?? 28}
		height={height ?? 28}
		className={className}
		style={style}
		{...rest}
	/>
);

/**
 * Logo — the horizontal wordmark "munshi."
 * Renders the official logo.svg asset (white, for dark backgrounds).
 * Accepts standard img props for className/style/width/height overrides.
 */
export const Logo = ({
	className,
	style,
	width,
	height,
	src,
	...rest
}: React.ImgHTMLAttributes<HTMLImageElement> & { src?: string }) => (
	<img
		src={src ?? "/branding/logo.svg"}
		alt="Munshi"
		className={className}
		style={{ display: 'block', height: height ?? '34px', width: width ?? 'auto', ...style }}
		{...rest}
	/>
);

/**
 * LogoDark — the horizontal wordmark for light backgrounds.
 */
export const LogoDark = ({
	className,
	style,
	width,
	height,
	...rest
}: React.ImgHTMLAttributes<HTMLImageElement>) => (
	<img
		src="/branding/logo-dark.svg"
		alt="Munshi"
		className={className}
		style={{ display: 'block', height: height ?? '34px', width: width ?? 'auto', ...style }}
		{...rest}
	/>
);

/**
 * LogoWhite — the horizontal wordmark for dark/colored backgrounds.
 */
export const LogoWhite = ({
	className,
	style,
	width,
	height,
	...rest
}: React.ImgHTMLAttributes<HTMLImageElement>) => (
	<img
		src="/branding/logo-white.svg"
		alt="Munshi"
		className={className}
		style={{ display: 'block', height: height ?? '34px', width: width ?? 'auto', ...style }}
		{...rest}
	/>
);
