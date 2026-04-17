interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeStyles = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

// Generate a subtle, professional gradient based on name
function getAvatarColor(first: string, last: string): string {
  const hash = (first.charCodeAt(0) + last.charCodeAt(0)) % 6;
  const colors = [
    "from-blue-100 to-blue-200 text-blue-700",
    "from-emerald-100 to-emerald-200 text-emerald-700",
    "from-violet-100 to-violet-200 text-violet-700",
    "from-amber-100 to-amber-200 text-amber-700",
    "from-rose-100 to-rose-200 text-rose-700",
    "from-cyan-100 to-cyan-200 text-cyan-700",
  ];
  return colors[hash];
}

export function Avatar({ firstName, lastName, size = "md", className = "" }: AvatarProps) {
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  const colorClass = getAvatarColor(firstName, lastName);
  return (
    <div
      className={`
        inline-flex items-center justify-center rounded-full bg-gradient-to-br font-semibold
        ${colorClass} ${sizeStyles[size]} ${className}
      `}
    >
      {initials}
    </div>
  );
}
