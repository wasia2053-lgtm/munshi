import React from "react";
import Link from "next/link";

interface BrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "full" | "white" | "icon";
  withTagline?: boolean;
  withLink?: boolean;
  linkHref?: string;
  className?: string;
}

export function BrandLogo({
  variant = "full",
  withTagline = false,
  withLink = false,
  linkHref = "/",
  className = "",
  style,
  height,
  ...props
}: BrandLogoProps) {
  let src = "/branding/logo.svg";
  if (variant === "white") src = "/branding/logo-white.svg";
  if (variant === "icon") src = "/branding/icon.svg";

  // Determine default height based on user's spec if not provided
  let defaultHeight = "36px"; // Header logo height: 36px
  if (variant === "icon") {
    defaultHeight = "38px"; // Sidebar collapsed icon: 38px
  }

  const resolvedHeight = height ?? defaultHeight;

  const imageElement = (
    <img
      src={src}
      alt="Munshi"
      className={className}
      style={{
        display: "block",
        height: resolvedHeight,
        width: "auto",
        ...style,
      }}
      {...props}
    />
  );

  const content = withTagline ? (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      {imageElement}
      <span
        style={{
          marginTop: "4px",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.6)",
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        AI Employee for SMBs
      </span>
    </div>
  ) : (
    imageElement
  );

  if (withLink) {
    return (
      <Link href={linkHref} style={{ textDecoration: "none" }}>
        {content}
      </Link>
    );
  }

  return content;
}
