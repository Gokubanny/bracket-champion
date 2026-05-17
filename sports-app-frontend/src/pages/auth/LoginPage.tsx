// src/pages/auth/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trophy, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const LOGIN_BG =
  "https://res.cloudinary.com/dxpquojo2/image/upload/v1779054966/640003797022724605_c24jip.jpg";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      navigate("/admin/dashboard");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-end overflow-hidden">
      {/* Full-bleed background */}
      <img
        src={LOGIN_BG}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />

      {/* Layered gradient — left is clear, right fades to deep black behind form */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/30 to-black/75 pointer-events-none" />
      {/* Bottom vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Glass panel — right-anchored */}
      <div className="relative z-10 w-full max-w-[420px] mx-4 sm:mx-8 lg:mr-20 lg:ml-auto">
        {/* Soft outer glow that bleeds past the card edges to blend into the scene */}
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
            <CardTitle className="text-2xl text-white drop-shadow">Welcome Back</CardTitle>
            <CardDescription className="text-white/60">
              Sign in to your ArenaX account
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  Sign In
                </Button>
              </form>
            </Form>
          </CardContent>
        </div>

        {/* Branding beneath card */}
        <p className="text-center text-white/30 text-xs mt-4">
          ArenaX — Student Sports Competition Platform
        </p>
      </div>
    </div>
  );
};

export default LoginPage;