import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type AuthMode = "login" | "signup";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get("mode") === "signup" ? "signup" : "login",
  );
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";
  const isLogin = mode === "login";

  useEffect(() => {
    const nextMode = searchParams.get("mode") === "signup" ? "signup" : "login";
    setMode(nextMode);
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [from, navigate, user]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setSearchParams(nextMode === "signup" ? { mode: "signup" } : {}, { replace: true });
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/list-generator`,
      },
    });
    
    if (error) {
      console.error("Google auth error", error.message);
      toast.error("Google Sign-In failed.");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) throw error;

        toast.success("Logged in successfully!");
        navigate(from, { replace: true });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Account created and logged in!");
        navigate(from, { replace: true });
      } else {
        toast.success("Signup successful! Please check your email to confirm your account.");
        switchMode("login");
      }
    } catch (error) {
      const message =
        error instanceof AuthError ? error.message : "Authentication failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-8 sm:px-6">
      <div className="w-full max-w-md rounded-[28px] border bg-card p-5 shadow-sm sm:p-8">
        <h2 className="mb-6 text-center text-2xl font-bold">
          {isLogin ? "Welcome Back" : "Create an Account"}
        </h2>
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
          <Button
            type="button"
            variant={isLogin ? "default" : "ghost"}
            onClick={() => switchMode("login")}
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant={!isLogin ? "default" : "ghost"}
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </Button>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button variant="outline" type="button" onClick={handleGoogleSignIn} className="h-11">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </Button>
        </div>

        <p className="mt-4 text-center text-sm leading-6 text-muted-foreground">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => switchMode(isLogin ? "signup" : "login")}
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
