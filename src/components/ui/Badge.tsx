import React from "react";

type BadgeVariant = "default" | "critical" | "warning" | "success" | "info" | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  critical: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-700",
  success: "bg-green-50 text-green-700",
  info: "bg-blue-50 text-blue-700",
  muted: "bg-gray-50 text-gray-500",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-gray-400",
  critical: "bg-red-500",
  warning: "bg-amber-500",
  success: "bg-green-500",
  info: "bg-blue-500",
  muted: "bg-gray-400",
};

export function Badge({ children, variant = "default", dot = false, className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md
        ${variantStyles[variant]} ${className}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}

// Helper to map room/patient status to badge variant
export function statusToBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "CRITICAL": return "critical";
    case "DISCHARGE_READY": return "success";
    case "UNDER_OBSERVATION": return "warning";
    case "OCCUPIED":
    case "ADMITTED":
    case "STABLE": return "info";
    case "EMPTY": return "muted";
    case "UNAVAILABLE":
    case "DISCHARGED": return "default";
    default: return "default";
  }
}
