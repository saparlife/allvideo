"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SetupPage() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user already has a username
      const { data: existingUser } = await (supabase as any)
        .from("users")
        .select("username")
        .eq("id", user.id)
        .single();

      if (existingUser?.username) {
        router.push("/studio");
        return;
      }

      setChecking(false);
    }

    checkUser();
  }, [supabase, router]);

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
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Session expired. Please sign in again.");
        router.push("/login");
        return;
      }

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

      // Update user metadata
      await supabase.auth.updateUser({
        data: { username: username.toLowerCase() }
      });

      // Update users table
      const { error } = await (supabase as any)
        .from("users")
        .update({ username: username.toLowerCase() })
        .eq("id", user.id);

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      toast.success("Profile setup complete!");
      router.push("/studio");
      router.refresh();
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl text-gray-900">Complete Your Profile</CardTitle>
        <CardDescription className="text-gray-500">
          Choose a unique username for your channel
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
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
                autoFocus
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
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
