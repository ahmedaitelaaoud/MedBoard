interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-11 h-11 text-base",
};

export function Avatar({ firstName, lastName, size = "md", className = "" }: AvatarProps) {
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  return (
    <div
      className={`
        inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium
        ${sizeStyles[size]} ${className}
      `}
    >
      {initials}
    </div>
  );
}
