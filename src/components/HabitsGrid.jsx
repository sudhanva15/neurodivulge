import React from "react";

/**
 * Responsive grid for habit cards.
 * - Defaults: 1 col on mobile, 2 on small screens, 3 on large, 4 on xl.
 * - Pass `columns` to override (e.g., "grid-cols-1 md:grid-cols-3").
 * - Accepts optional `className` to append extra utilities.
 */
export default function HabitsGrid({ children, columns, className = "" }) {
  const colClasses =
    columns || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  return (
    <div className={`grid ${colClasses} gap-4 ${className}`}>{children}</div>
  );
}
