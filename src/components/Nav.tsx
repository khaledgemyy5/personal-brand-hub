import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/writing", label: "Writing" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const location = useLocation();

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
          <ul className="flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
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
          <Button asChild size="sm">
            <Link to="/resume">Resume</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
