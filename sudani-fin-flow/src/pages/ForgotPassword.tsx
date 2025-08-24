import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const forgotPasswordSchema = z.object({
  email: z.string().email(""),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsLoading(true);

      // Use the configured API base URL
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
      const response = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      // Check if response has content
      const responseText = await response.text();
      let result;

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Response text:", responseText);
        throw new Error("Invalid response from server");
      }

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: t("resetLinkSent"),
          description: t("resetLinkSentDesc"),
        });
      } else {
        toast({
          variant: "destructive",
          title: t("error"),
          description: result.message || t("connectionError"),
        });
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message || t("connectionError"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-600 mb-2">
              {t("resetLinkSent")}
            </h2>
            <p className="text-gray-600 mb-4">{t("resetLinkSentDesc")}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-700 text-sm">
                <strong>{t("checkSpamNote").split(":")[0]}:</strong>{" "}
                {t("checkSpamNote").split(":")[1]}
              </p>
            </div>
            <Button onClick={() => navigate("/login")} className="w-full">
              {t("backToLogin")}
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
            onClick={() => navigate("/login")}
            variant="ghost"
            size="sm"
            className="absolute left-4 top-4"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            {t("backToLogin")}
          </Button>
          <CardTitle className="text-2xl">{t("forgotPasswordTitle")}</CardTitle>
          <p className="text-gray-600 text-sm">{t("forgotPasswordSubtitle")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  className="pr-10"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{t("invalidEmail")}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("sending") : t("sendResetLink")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
