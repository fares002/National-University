import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, ""),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("invalidResetLink"),
      });
      navigate("/forgot-password");
      return;
    }

    // Verify token validity
    const verifyToken = async () => {
      try {
        const apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
        const response = await fetch(
          `${apiBaseUrl}/auth/verify-reset-token/${token}`
        );
        console.log(response);
        if (response.ok) {
          setTokenValid(true);
        } else {
          toast({
            variant: "destructive",
            title: t("error"),
            description: t("expiredResetLink"),
          });
          navigate("/forgot-password");
        }
      } catch (error) {
        console.error("Token verification error:", error);
        toast({
          variant: "destructive",
          title: t("error"),
          description: t("linkVerificationError"),
        });
        navigate("/forgot-password");
      }
    };

    verifyToken();
  }, [token, navigate, toast, t]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;

    try {
      setIsLoading(true);

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
      const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: t("success"),
          description: t("passwordResetSuccess"),
        });
      } else {
        toast({
          variant: "destructive",
          title: t("error"),
          description: result.message || t("resetPasswordError"),
        });
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message || t("connectionError"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t("verifyingLink")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-600 mb-2">
              {t("passwordResetSuccess")}
            </h2>
            <p className="text-gray-600 mb-4">
              {t("passwordResetSuccessDesc")}
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              {t("goToLogin")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button
            onClick={() => navigate("/forgot-password")}
            variant="ghost"
            size="sm"
            className="absolute left-4 top-4"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            {t("backToForgotPassword")}
          </Button>
          <CardTitle className="text-2xl">{t("resetPasswordTitle")}</CardTitle>
          <p className="text-gray-600 text-sm">{t("resetPasswordSubtitle")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("newPassword")}</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("newPasswordPlaceholder")}
                  className="pr-10"
                  {...register("newPassword")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-600">
                  {errors.newPassword.message === ""
                    ? t("passwordComplexity")
                    : t("passwordMinLength")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("confirmPasswordPlaceholder")}
                  className="pr-10"
                  {...register("confirmPassword")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{t("passwordsMismatch")}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("resetting") : t("resetPassword")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
