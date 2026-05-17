// src/pages/auth/RegisterPage.tsx
import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trophy, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const REGISTER_BG =
  "https://res.cloudinary.com/dxpquojo2/image/upload/v1779055880/Sports_Accesories_fsbbis.jpg";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address").max(255),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const getPasswordStrength = (
  password: string
): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 25;
  if (/\d/.test(password)) score += 25;
  if (/[^a-zA-Z0-9]/.test(password)) score += 25;
  if (score <= 25) return { score, label: "Weak", color: "bg-destructive" };
  if (score <= 50) return { score, label: "Fair", color: "bg-warning" };
  if (score <= 75) return { score, label: "Good", color: "bg-primary" };
  return { score, label: "Strong", color: "bg-success" };
};

const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const watchPassword = form.watch("password");
  const strength = useMemo(
    () => getPasswordStrength(watchPassword || ""),
    [watchPassword]
  );

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await registerUser(data.fullName, data.email, data.password);
      toast.success("Account created! Redirecting...");
      navigate("/admin/dashboard");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-end overflow-hidden">
      {/* Full-bleed background */}
      <img
        src={REGISTER_BG}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/30 to-black/75 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Glass panel — right-anchored */}
      <div className="relative z-10 w-full max-w-[420px] mx-4 sm:mx-8 lg:mr-20 lg:ml-auto">
        {/* Soft outer glow that bleeds past the card edges */}
        <div className="absolute -inset-6 rounded-3xl bg-white/5 backdrop-blur-2xl" />

        {/* Inner glass card */}
        <div
          className="relative rounded-2xl overflow-hidden border border-white/10"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)",
          }}
        >
          <CardHeader className="text-center space-y-2 pt-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center backdrop-blur-sm">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl text-white drop-shadow">
              Create Admin Account
            </CardTitle>
            <CardDescription className="text-white/60">
              Register a new administrator account
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          {...field}
                          className="bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-primary/60 focus:bg-white/15 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          {...field}
                          className="bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-primary/60 focus:bg-white/15 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            className="pr-10 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-primary/60 focus:bg-white/15 transition-colors"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      {watchPassword && (
                        <div className="space-y-1 mt-1">
                          <Progress
                            value={strength.score}
                            className={`h-1.5 [&>div]:${strength.color}`}
                          />
                          <p className="text-xs text-white/50">{strength.label}</p>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-primary/60 focus:bg-white/15 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full mt-2 bg-primary/90 hover:bg-primary text-white font-medium"
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create Account
                </Button>
              </form>
            </Form>

            <p className="text-center text-sm text-white/40 mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-primary/80 hover:text-primary transition-colors">
                Sign in
              </Link>
            </p>
          </CardContent>
        </div>

        <p className="text-center text-white/30 text-xs mt-4">
          ArenaX — Student Sports Competition Platform
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;