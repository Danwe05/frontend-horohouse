import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  end?: boolean;
  caseSensitive?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ 
    className, 
    activeClassName, 
    pendingClassName, 
    to, 
    end = false,
    caseSensitive = false,
    ...props 
  }, ref) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    // Simple active state detection
    // For more complex matching, you might want to use a library like path-to-regexp
    const currentPath = caseSensitive ? pathname : pathname.toLowerCase();
    const targetPath = caseSensitive ? to : to.toLowerCase();
    
    let isActive = false;
    
    if (end) {
      // Exact match for end=true
      isActive = currentPath === targetPath;
    } else {
      // Partial match for end=false
      isActive = currentPath.startsWith(targetPath);
    }
    
    return (
      <Link
        ref={ref}
        href={to}
        className={cn(className, isActive && activeClassName)}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };