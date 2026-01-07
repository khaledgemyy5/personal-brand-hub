import { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { getSupabase, supabaseReady } from "@/lib/supabaseClient";
import { checkIsAdmin, signInWithEmail, signOut } from "@/lib/adminAuth";
import type { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogOut, AlertTriangle, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminGuard() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    
    // If Supabase not configured, show setup
    if (!supabase) {
      setNeedsSetup(true);
      setLoading(false);
      return;
    }

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

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
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

  // Show setup wizard if Supabase not configured or user not admin yet
  if (needsSetup || (!user && !supabaseReady)) {
    return <AdminSetup />;
  }

  // Not signed in - show login
  if (!user || !session) {
    return <AdminLogin />;
  }

  // Signed in but checking admin or needs to claim
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
    <div className="min-h-screen flex items-center justify-center p-4">
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
      </div>
    </div>
  );
}

function AdminSetup() {
  const StatusIcon = ({ ok }: { ok: boolean }) => 
    ok ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />;

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
              <span>Claim admin</span>
            </li>
          </ul>
        </div>

        <div className="p-4 border border-border rounded-lg bg-card space-y-3">
          <h2 className="font-medium">Steps</h2>
          <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
            <li>Set <code className="bg-muted px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-muted px-1 rounded">VITE_SUPABASE_ANON_KEY</code></li>
            <li>Run <code className="bg-muted px-1 rounded">docs/sql/000_all.sql</code> in Supabase SQL Editor</li>
            <li>Create a user in Supabase Auth</li>
            <li>Sign in and click "Claim Admin"</li>
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

function AdminClaimOrDeny({ email, userId }: { email?: string; userId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canClaim, setCanClaim] = useState(false);

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
        .select('admin_user_id')
        .limit(1)
        .maybeSingle();

      if (data?.admin_user_id === '00000000-0000-0000-0000-000000000000') {
        setCanClaim(true);
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
