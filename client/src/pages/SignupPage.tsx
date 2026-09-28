import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  BookOpen,
  Mail,
  GraduationCap,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setIsLoading(true);
      await register({
        username: username.trim(),
        password,
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        registrationNumber: registrationNumber.trim().toUpperCase() || undefined,
      });
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 py-8 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
            VIT Bhopal
          </h1>
          <p className="text-xs font-medium text-blue-600 mt-1 uppercase tracking-wider">
            Knowledge Base
          </p>
        </div>
      </div>

      {/* Signup Card */}
      <Card className="w-full max-w-md shadow-xl border-slate-200/80 bg-white/95 backdrop-blur">
        <CardHeader className="space-y-1.5 pb-3">
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Create an account
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm">
            Sign up to upload and query university materials with our AI
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3.5">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-1">
              <Label htmlFor="signup-username">
                Username <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </div>
                <Input
                  id="signup-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="e.g. ajsarmah"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <Label htmlFor="signup-password">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="signup-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Full Name Field (Optional) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="signup-name">Full Name</Label>
                <span className="text-xs text-slate-400">Optional</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <Input
                  id="signup-name"
                  name="name"
                  type="text"
                  placeholder="e.g. Amlan Sarmah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Registration Number Field (Optional) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="signup-reg">Registration Number</Label>
                <span className="text-xs text-slate-400">Optional</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <Input
                  id="signup-reg"
                  name="registrationNumber"
                  type="text"
                  placeholder="e.g. 22BCI10001"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                  className="pl-9 uppercase"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email Field (Optional) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="signup-email">Email Address</Label>
                <span className="text-xs text-slate-400">Optional</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="student@vitbhopal.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              className="w-full font-semibold shadow-md shadow-blue-500/10"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </Button>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* University Footer Note */}
      <p className="mt-8 text-xs text-slate-400 text-center">
        VIT Bhopal University • Academic Knowledge Sharing Portal
      </p>
    </div>
  );
};
