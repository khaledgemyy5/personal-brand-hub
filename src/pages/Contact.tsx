import { Mail, MapPin } from "lucide-react";

export default function Contact() {
  return (
    <>
      <title>Contact - Ammar</title>
      <meta name="description" content="Get in touch with Ammar. Available for consulting, collaboration, and opportunities." />
      
      <div className="container-narrow section-spacing">
        <h1 className="mb-4">Contact</h1>
        <p className="text-muted-foreground mb-12">
          Have a project in mind or want to chat? Feel free to reach out.
        </p>
        
        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">Email</h3>
                <a 
                  href="mailto:hello@example.com"
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  hello@example.com
                </a>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">Location</h3>
                <p className="text-muted-foreground">
                  San Francisco, CA
                </p>
              </div>
            </div>
            
            <div className="pt-4">
              <h3 className="font-medium mb-3">Connect</h3>
              <div className="flex items-center gap-4">
                <a 
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
                <a 
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  LinkedIn
                </a>
                <a 
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Twitter
                </a>
              </div>
            </div>
          </div>
          
          {/* Contact Form Placeholder */}
          <div className="p-6 border border-border rounded-lg bg-card">
            <h3 className="font-serif text-lg font-medium mb-4">Send a message</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Contact form will be implemented with Supabase Edge Functions for email delivery.
            </p>
            
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                  Name
                </label>
                <input 
                  type="text" 
                  id="name"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Your name"
                  disabled
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                  Email
                </label>
                <input 
                  type="email" 
                  id="email"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="you@example.com"
                  disabled
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1.5">
                  Message
                </label>
                <textarea 
                  id="message"
                  rows={4}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Your message..."
                  disabled
                />
              </div>
              
              <button
                type="button"
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium opacity-50 cursor-not-allowed"
                disabled
              >
                Send message (coming soon)
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
