import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("يرجى إدخال بريد إلكتروني صحيح")
    .max(100, "البريد الإلكتروني يجب ألا يزيد عن 100 حرف"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, login, isLoading } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      const success = await login(data.email, data.password);

      if (success) {
        toast({
          title: t("loginSuccessTitle"),
          description: t("loginSuccessDesc"),
        });
        navigate("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: t("loginErrorTitle"),
          description: t("loginErrorDesc"),
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("loginNetworkErrorTitle"),
        description: t("loginNetworkErrorDesc"),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Toggle */}
        <div className="flex justify-end mb-4 text-slate-300">
          <LanguageToggle />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-strong p-8">
          {/* University Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full flex items-center justify-center">
                <img src="/national.ico" className="h-16 w-16 " />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t("universityName")}
            </h1>
            <p className="text-muted-foreground">{t("systemName")}</p>
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {t("welcomeBack")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("loginSubtitle")}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                className="h-11"
                placeholder={t("emailPlaceholder")}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className="h-11 pr-10"
                  placeholder={t("passwordPlaceholder")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">

              <Button
                variant="link"
                className="px-0 text-sm"
                onClick={() => navigate("/forgot-password")}
              >
                {t("forgotPassword")}
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-primary hover:opacity-90 transition-smooth"
              disabled={isLoading || isSubmitting}
            >
              {isLoading || isSubmitting ? t("loggingIn") : t("login")}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white/80 text-sm">
          <p>
            © 2025 {t("universityName")} - {t("allRightsReserved")}
          </p>
        </div>
      </div>
    </div>
  );
}
