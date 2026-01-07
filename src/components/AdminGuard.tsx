import { useEffect, useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { checkIsAdmin, signInWithEmail, signOut } from "@/lib/adminAuth";
import type { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogOut, AlertTriangle, CheckCircle, XCircle, ArrowLeft, Key, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Status icon component
const StatusIcon = ({ ok }: { ok: boolean }) => {
  if (ok) {
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  }
  return <XCircle className="w-4 h-4 text-red-500" />;
};

type SchemaStatus = "checking" | "missing" | "ready" | "error";

export function AdminGuard() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [schemaStatus, setSchemaStatus] = useState<SchemaStatus>("checking");
  const [isBootstrapped, setIsBootstrapped] = useState<boolean | null>(null);

  useEffect(() => {
    // If env vars missing, show setup immediately
    if (!isSupabaseConfigured) {
      setSchemaStatus("missing");
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setSchemaStatus("missing");
      setLoading(false);
      return;
    }

    // Check schema by querying site_settings
    const checkSchema = async () => {
      try {
        const { error } = await supabase
          .from('site_settings')
          .select('id')
          .limit(1);
        
        if (error) {
          // Check if it's a "relation does not exist" error
          if (error.message.includes('does not exist') || error.code === '42P01') {
            setSchemaStatus("missing");
            return false;
          }
          // Other errors (RLS, etc) mean schema exists
          setSchemaStatus("ready");
          return true;
        }
        
        setSchemaStatus("ready");
        return true;
      } catch {
        setSchemaStatus("error");
        return false;
      }
    };

    // Check if site is bootstrapped
    const checkBootstrap = async () => {
      try {
        const { data } = await supabase
          .from('public_site_settings')
          .select('is_bootstrapped')
          .limit(1)
          .maybeSingle();
        
        setIsBootstrapped(data?.is_bootstrapped ?? false);
      } catch {
        setIsBootstrapped(false);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer admin check with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkIsAdmin(session.user.id).then(setIsAdmin);
          }, 0);
        } else {
          setIsAdmin(null);
        }
      }
    );

    // THEN check schema, session, and bootstrap status
    const init = async () => {
      const schemaReady = await checkSchema();
      
      if (!schemaReady) {
        setLoading(false);
        return;
      }

      await checkBootstrap();
      
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const adminStatus = await checkIsAdmin(session.user.id);
        setIsAdmin(adminStatus);
      }
      
      setLoading(false);
    };

    init();

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/30 via-background to-muted/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show setup if env vars missing OR schema not initialized
  if (!isSupabaseConfigured || schemaStatus === "missing") {
    return <AdminSetup envReady={isSupabaseConfigured} schemaReady={schemaStatus === "ready"} />;
  }

  // Not signed in - show login
  if (!user || !session) {
    return <AdminLogin />;
  }

  // Signed in but site not bootstrapped - show bootstrap form
  if (isBootstrapped === false) {
    return <AdminBootstrap email={user.email} />;
  }

  // Signed in but not admin - show claim/deny
  if (isAdmin === false) {
    return <AdminClaimOrDeny email={user.email} userId={user.id} />;
  }

  // Loading admin status
  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/30 via-background to-muted/50">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Authorized admin
  return <Outlet />;
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signInWithEmail(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success, the auth state listener will update
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-muted/30 via-background to-muted/50">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-lg p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-serif font-medium">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your site content
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>
        
        {/* Back link */}
        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}

function AdminSetup({ envReady, schemaReady }: { envReady: boolean; schemaReady: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-muted/30 via-background to-muted/50">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-xl shadow-lg p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            </div>
            <h1 className="text-2xl font-serif font-medium">Setup Required</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Complete the following steps to enable admin functionality.
            </p>
          </div>

          {/* Checklist */}
          <div className="p-4 border border-border rounded-lg bg-muted/30 space-y-3">
            <h2 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Checklist</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-3">
                <StatusIcon ok={envReady} />
                <span className={envReady ? "text-foreground" : "text-muted-foreground"}>
                  Environment variables set
                </span>
              </li>
              <li className="flex items-center gap-3">
                <StatusIcon ok={schemaReady} />
                <span className={schemaReady ? "text-foreground" : "text-muted-foreground"}>
                  Database schema initialized
                </span>
              </li>
              <li className="flex items-center gap-3">
                <XCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Auth user created</span>
              </li>
              <li className="flex items-center gap-3">
                <XCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Bootstrap token initialized</span>
              </li>
            </ul>
          </div>

          {/* Instructions */}
          <div className="space-y-3 text-sm">
            <h2 className="font-medium">Next Steps</h2>
            <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
              {!envReady && (
                <li>
                  Set <code className="bg-muted px-1.5 py-0.5 rounded text-xs">VITE_SUPABASE_URL</code> and{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">VITE_SUPABASE_ANON_KEY</code>
                </li>
              )}
              {!schemaReady && (
                <li>
                  Run <code className="bg-muted px-1.5 py-0.5 rounded text-xs">docs/sql/000_all.sql</code> in Supabase SQL Editor
                </li>
              )}
              <li>Create a user in Supabase Auth</li>
              <li>Sign in and complete bootstrap</li>
            </ol>
          </div>

          {/* Actions */}
          <Button asChild variant="outline" className="w-full gap-2">
            <Link to="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Site
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminBootstrap({ email }: { email?: string }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const supabase = getSupabase();
    if (!supabase) return;

    setLoading(true);
    
    const { data, error } = await supabase.rpc('bootstrap_set_admin', { p_token: token });
    
    if (error) {
      toast({ title: "Bootstrap failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    
    if (data?.success) {
      toast({ 
        title: "🎉 Welcome, Admin!", 
        description: "You now have full access. Redirecting to dashboard..." 
      });
      setTimeout(() => {
        navigate("/admin/dashboard");
        window.location.reload();
      }, 1000);
    } else {
      toast({ title: "Bootstrap failed", description: data?.error || "Unknown error", variant: "destructive" });
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-muted/30 via-background to-muted/50">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-xl shadow-lg p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-serif font-medium">Initialize Site</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your bootstrap token to become the admin.
            </p>
            {email && (
              <p className="text-xs text-muted-foreground mt-1">
                Signed in as <span className="font-medium">{email}</span>
              </p>
            )}
          </div>

          <form onSubmit={handleBootstrap} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Bootstrap Token</Label>
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your bootstrap token"
                required
                autoComplete="off"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                This is the token you generated and set in the database.
              </p>
            </div>

            <Button type="submit" className="w-full h-11 gap-2" disabled={loading || !token}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Initialize & Become Admin
                </>
              )}
            </Button>
          </form>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSignOut}
              disabled={loading}
              className="flex-1 gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
            <Button asChild variant="ghost" className="flex-1">
              <Link to="/">Back to Site</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminClaimOrDeny({ email, userId }: { email?: string; userId: string }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canClaim, setCanClaim] = useState(false);
  const [requiresToken, setRequiresToken] = useState(false);

  useEffect(() => {
    async function checkClaimStatus() {
      const supabase = getSupabase();
      if (!supabase) {
        setChecking(false);
        return;
      }

      // Check if admin is already claimed by checking site_settings
      const { data } = await supabase
        .from('site_settings')
        .select('admin_user_id, bootstrap_token_hash')
        .limit(1)
        .maybeSingle();

      if (data?.admin_user_id === null) {
        // Not bootstrapped yet
        if (data?.bootstrap_token_hash) {
          setRequiresToken(true);
        } else {
          setCanClaim(true);
        }
      }
      setChecking(false);
    }
    checkClaimStatus();
  }, []);

  const handleClaimAdmin = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    setLoading(true);
    const { data, error } = await supabase.rpc('claim_admin');
    
    if (error) {
      toast({ title: "Claim failed", description: error.message, variant: "destructive" });
      setLoading(false);
    } else if (data?.success) {
      toast({ 
        title: "🎉 Admin Claimed!", 
        description: "Redirecting to dashboard..." 
      });
      setTimeout(() => {
        navigate("/admin/dashboard");
        window.location.reload();
      }, 1000);
    } else {
      toast({ title: "Claim failed", description: data?.error || "Unknown error", variant: "destructive" });
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/30 via-background to-muted/50">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Requires token - redirect to bootstrap
  if (requiresToken) {
    return <AdminBootstrap email={email} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-muted/30 via-background to-muted/50">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-xl shadow-lg p-8 text-center space-y-6">
          <div>
            <h1 className="text-2xl font-serif font-medium">
              {canClaim ? "Claim Admin Access" : "Not Authorized"}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Signed in as <span className="font-medium">{email}</span>
            </p>
          </div>

          {canClaim ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Be the first to claim admin rights for this site.
              </p>
              <Button onClick={handleClaimAdmin} disabled={loading} className="w-full gap-2">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Claim Admin
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This account does not have admin access.
            </p>
          )}

          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={loading}
            className="w-full gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
