export default function AdminSettings() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-serif font-medium mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">
        Manage site settings, SEO, and theme.
      </p>
      
      {/* Profile Section */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-4">Profile</h2>
        <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
          <FormField label="Name" placeholder="Your name" />
          <FormField label="Title" placeholder="Software Engineer" />
          <FormField label="Bio" placeholder="A brief bio..." textarea />
          <FormField label="Email" placeholder="you@example.com" type="email" />
          <FormField label="Location" placeholder="City, Country" />
        </div>
      </section>
      
      {/* Social Links */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-4">Social Links</h2>
        <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
          <FormField label="GitHub" placeholder="https://github.com/username" />
          <FormField label="LinkedIn" placeholder="https://linkedin.com/in/username" />
          <FormField label="Twitter" placeholder="https://twitter.com/username" />
        </div>
      </section>
      
      {/* SEO Settings */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-4">SEO</h2>
        <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
          <FormField label="Site Title" placeholder="Ammar - Software Engineer" />
          <FormField label="Meta Description" placeholder="Personal site of Ammar..." textarea />
          <FormField label="OG Image URL" placeholder="https://example.com/og.png" />
        </div>
      </section>
      
      {/* Theme Settings */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-4">Theme</h2>
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Dark Mode</h3>
              <p className="text-sm text-muted-foreground">Toggle dark mode for the site</p>
            </div>
            <button 
              className="w-12 h-6 rounded-full bg-muted relative transition-colors"
              disabled
            >
              <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-foreground transition-transform" />
            </button>
          </div>
        </div>
      </section>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button 
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium opacity-50 cursor-not-allowed"
          disabled
        >
          Save Changes
        </button>
      </div>
      
      <p className="text-sm text-muted-foreground mt-4 text-center">
        Settings persistence will be implemented with Supabase.
      </p>
    </div>
  );
}

function FormField({ 
  label, 
  placeholder, 
  type = "text",
  textarea = false,
}: { 
  label: string; 
  placeholder: string; 
  type?: string;
  textarea?: boolean;
}) {
  const inputClasses = "w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";
  
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {textarea ? (
        <textarea 
          className={`${inputClasses} resize-none`}
          placeholder={placeholder}
          rows={3}
          disabled
        />
      ) : (
        <input 
          type={type}
          className={inputClasses}
          placeholder={placeholder}
          disabled
        />
      )}
    </div>
  );
}
