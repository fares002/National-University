import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import {
Form,
FormControl,
FormField,
FormItem,
FormLabel,
FormMessage,
} from "@/components/ui/form";
import {
USERNAME_MIN,
USERNAME_MAX,
PASSWORD_MIN,
PASSWORD_MAX,
usernameRegex,
passwordComplexityRegex,
} from "./validation";
// Types
export type Role = "admin" | "auditor";
const buildUserSchema = (t: any) =>
z
    .object({
    username: z
        .string()
        .min(USERNAME_MIN, t("validation.usernameMin", { min: USERNAME_MIN }))
        .max(USERNAME_MAX, t("validation.usernameMax", { max: USERNAME_MAX }))
        .regex(usernameRegex, t("validation.usernamePattern")),
    email: z.string().email(t("validation.emailInvalid")),
    password: z
        .string()
        .min(PASSWORD_MIN, t("validation.passwordMin", { min: PASSWORD_MIN }))
        .max(PASSWORD_MAX, t("validation.passwordMax", { max: PASSWORD_MAX }))
        .regex(passwordComplexityRegex, t("validation.passwordComplexity")),
    passwordConfirmation: z.string(),
    role: z.enum(["admin", "auditor"], {
        required_error: t("validation.roleRequired"),
    }),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
    message: t("validation.passwordsMismatch"),
    path: ["passwordConfirmation"],
    });
export type UserFormData = z.infer<ReturnType<typeof buildUserSchema>>;
export interface UserFormProps {
onSubmit: (data: UserFormData) => Promise<void> | void;
onCancel: () => void;
initialValues?: Partial<UserFormData>;
}
export function UserForm({ onSubmit, onCancel, initialValues }: UserFormProps) {
const [isSubmitting, setIsSubmitting] = useState(false);
const { t, i18n } = useTranslation();

// Check if current language is RTL (Arabic)
const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
const form = useForm<UserFormData>({
    resolver: zodResolver(buildUserSchema(t)),
    defaultValues: {
    username: initialValues?.username ?? "",
    email: initialValues?.email ?? "",
    password: initialValues?.password ?? "",
    passwordConfirmation: initialValues?.passwordConfirmation ?? "",
    role: (initialValues?.role as Role) ?? "auditor",
    },
});
const handleSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
    await onSubmit(data);
    form.reset({
        username: "",
        email: "",
        password: "",
        passwordConfirmation: "",
        role: "auditor",
    });
    } finally {
    setIsSubmitting(false);
    }
};
return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
            <FormItem>
                <FormLabel>{t("form.username", "اسم المستخدم")}</FormLabel>
                <FormControl>
                <Input placeholder={t("form.usernamePlaceholder", "أدخل اسم المستخدم")} {...field} />
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
                <FormLabel>{t("form.email", "البريد الإلكتروني")}</FormLabel>
                <FormControl>
                <Input
                    type="email"
                    placeholder="example@mail.com"
                    {...field}
                />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="password"
            render={({ field }) => {
            const [showPassword, setShowPassword] = useState(false);
            return (
                <FormItem>
                <FormLabel>{t("form.password", "كلمة المرور")}</FormLabel>
                <FormControl>
                    <div className="relative">
                    <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••"
                        {...field}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute inset-y-0 ${
                        isRTL ? 'left-3' : 'right-3'
                        } flex items-center text-gray-500 hover:text-gray-700`}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            );
            }}
        />
        <FormField
            control={form.control}
            name="passwordConfirmation"
            render={({ field }) => {
            const [showConfirmPassword, setShowConfirmPassword] = useState(false);
            return (
                <FormItem>
                <FormLabel>{t("form.confirmPassword", "تأكيد كلمة المرور")}</FormLabel>
                <FormControl>
                    <div className="relative">
                    <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••"
                        {...field}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute inset-y-0 ${
                        isRTL ? 'left-3' : 'right-3'
                        } flex items-center text-gray-500 hover:text-gray-700`}
                    >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            );
            }}
        />
        <div className="md:col-span-2">
            <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t("form.role", "الدور")}</FormLabel>
                <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                >
                    <FormControl>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("form.selectRole", "اختر الدور")} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="auditor">{t("roles.auditor", "مراجع")}</SelectItem>
                    <SelectItem value="admin">{t("roles.admin", "مدير")}</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        </div>
        <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
            {t("form.cancel", "إلغاء")}
        </Button>
        <Button type="submit" className="bg-gradient-primary" disabled={isSubmitting}>
            {isSubmitting ? t("form.saving", "جاري الحفظ...") : t("form.save", "حفظ")}
        </Button>
        </div>
    </form>
    </Form>
);
}