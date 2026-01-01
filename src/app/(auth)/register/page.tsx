"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const validateUsername = (value: string) => {
    if (value.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return false;
    }
    if (value.length > 30) {
      setUsernameError("Username must be less than 30 characters");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError("Username can only contain letters, numbers, and underscores");
      return false;
    }
    setUsernameError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUsername(username)) {
      return;
    }

    setIsLoading(true);

    try {
      // Check if username is available
      const { data: existingUser } = await (supabase as any)
        .from("users")
        .select("id")
        .eq("username", username.toLowerCase())
        .single();

      if (existingUser) {
        toast.error("This username is already taken");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Supabase returns success but empty identities if email already exists
      if (data.user && data.user.identities?.length === 0) {
        toast.error("This email is already registered. Please sign in instead.");
        return;
      }

      toast.success("Account created! Check your email to confirm.");
      router.push("/login");
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardContent className="pt-6 pb-4 space-y-4">
        <OAuthButtons />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">or create with email</span>
          </div>
        </div>
      </CardContent>

      <form onSubmit={handleSubmit}>
        <CardContent className="pt-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-700">
              Username
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                @
              </span>
              <Input
                id="username"
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (e.target.value) validateUsername(e.target.value);
                }}
                required
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 pl-8"
              />
            </div>
            {usernameError && (
              <p className="text-xs text-red-500">{usernameError}</p>
            )}
            <p className="text-xs text-gray-500">
              This will be your channel URL: unlimvideo.com/channel/{username || "username"}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <p className="text-xs text-gray-500 pb-2">
            By signing up, you agree to our Terms of Service.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
          <p className="text-sm text-gray-500 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 hover:underline cursor-pointer">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
