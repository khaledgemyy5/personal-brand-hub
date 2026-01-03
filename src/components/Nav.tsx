import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { NavConfig } from "@/lib/types";

interface NavProps {
  navConfig: NavConfig | null;
  hasProjects: boolean | null;
  hasWriting: boolean | null;
}

export function Nav({ navConfig, hasProjects, hasWriting }: NavProps) {
  const location = useLocation();
  const isLoading = navConfig === null || hasProjects === null || hasWriting === null;

  // Filter visible links based on nav_config and content availability
  const visibleLinks = navConfig?.links.filter((link) => {
    if (!link.visible) return false;
    if (link.href === "/projects" && hasProjects === false) return false;
    if (link.href === "/writing" && hasWriting === false) return false;
    return true;
  }) ?? [];

  const ctaButton = navConfig?.ctaButton;
  const showCta = ctaButton?.visible && ctaButton?.href && ctaButton?.label;

  return (
    <header className="border-b border-border">
      <nav className="container-narrow py-6 flex items-center justify-between">
        <Link 
          to="/" 
          className="font-serif text-xl font-medium tracking-tight hover:text-accent transition-colors"
        >
          Ammar
        </Link>
        
        <div className="flex items-center gap-6">
          {isLoading ? (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-6">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ) : (
            <>
              <ul className="flex items-center gap-6 text-sm">
                {visibleLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className={`transition-colors hover:text-foreground ${
                        location.pathname === link.href
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {showCta && (
                <Button asChild size="sm">
                  <Link to={ctaButton.href}>{ctaButton.label}</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
