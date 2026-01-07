import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-auto">
      <div className="container-narrow py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <p>© {currentYear} Ammar Jaber</p>
          
          <div className="flex items-center gap-6">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              LinkedIn
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Twitter
            </a>
          </div>
        </div>
        
        <p className="text-center text-xs text-muted-foreground/50 mt-8">
          <Link to="/admin" className="hover:text-muted-foreground transition-colors">
            Admin
          </Link>
        </p>
      </div>
    </footer>
  );
}
