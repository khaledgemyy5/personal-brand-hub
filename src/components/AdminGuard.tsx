import { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { getSupabase, supabaseReady } from "@/lib/supabaseClient";
import { checkIsAdmin, signInWithEmail, signOut } from "@/lib/adminAuth";
import type { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogOut, AlertTriangle, CheckCircle, XCircle, ArrowLeft, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Status icon component (module-level to avoid ref warnings)
const StatusIcon = ({ ok }: { ok: boolean }) => {
  if (ok) {
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  }
  return <XCircle className="w-4 h-4 text-red-500" />;
};

export function AdminGuard() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isBootstrapped, setIsBootstrapped] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    
    // If Supabase not configured, show setup
    if (!supabase) {
      setNeedsSetup(true);
      setLoading(false);
      return;
    }

    // Check if site is bootstrapped
    const checkBootstrap = async () => {
      const { data } = await supabase
        .from('public_site_settings')
        .select('is_bootstrapped')
        .limit(1)
        .maybeSingle();
      
      setIsBootstrapped(data?.is_bootstrapped ?? false);
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

    // THEN check for existing session and bootstrap status
    Promise.all([
      supabase.auth.getSession(),
      checkBootstrap()
    ]).then(([{ data: { session } }]) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkIsAdmin(session.user.id).then((result) => {
          setIsAdmin(result);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show setup wizard if Supabase not configured
  if (needsSetup || !supabaseReady) {
    return <AdminSetup />;
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
      <div className="min-h-screen flex items-center justify-center bg-background">
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-medium">Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to manage your site
          </p>
        </div>

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
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
        
        <div className="text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}

function AdminSetup() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-medium">Setup Required</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Configure Supabase to enable admin functionality.
          </p>
        </div>

        <div className="p-4 border border-border rounded-lg bg-card space-y-3">
          <h2 className="font-medium">Setup Checklist</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <StatusIcon ok={supabaseReady} />
              <span>Environment variables set</span>
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-muted-foreground" />
              <span>Run SQL script in Supabase</span>
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-muted-foreground" />
              <span>Create auth user</span>
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-muted-foreground" />
              <span>Initialize with bootstrap token</span>
            </li>
          </ul>
        </div>

        <div className="p-4 border border-border rounded-lg bg-card space-y-3">
          <h2 className="font-medium">Steps</h2>
          <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
            <li>Set <code className="bg-muted px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-muted px-1 rounded">VITE_SUPABASE_ANON_KEY</code></li>
            <li>Run <code className="bg-muted px-1 rounded">docs/sql/000_all.sql</code> in Supabase SQL Editor</li>
            <li>Set the bootstrap token hash (see SQL comments)</li>
            <li>Create a user in Supabase Auth</li>
            <li>Sign in and enter your bootstrap token</li>
          </ol>
        </div>

        <div className="flex gap-3">
          <Button asChild variant="outline" className="flex-1 gap-2">
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
      toast({ title: "Success!", description: data.message || "You are now the admin." });
      setTimeout(() => window.location.reload(), 500);
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Key className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-medium">Initialize Site</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your bootstrap token to become the admin.
          </p>
          {email && (
            <p className="text-xs text-muted-foreground mt-1">
              Signed in as {email}
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
            />
            <p className="text-xs text-muted-foreground">
              This is the token you generated and set in the database.
            </p>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={loading || !token}>
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
  );
}

function AdminClaimOrDeny({ email, userId }: { email?: string; userId: string }) {
  const { toast } = useToast();
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
      toast({ title: "Admin claimed!", description: "Reloading..." });
      setTimeout(() => window.location.reload(), 500);
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Requires token - redirect to bootstrap
  if (requiresToken) {
    return <AdminBootstrap email={email} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm text-center space-y-6">
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
          className="gap-2"
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
  );
}
