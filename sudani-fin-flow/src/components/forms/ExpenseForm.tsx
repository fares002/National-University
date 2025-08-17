import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ExpenseCategory } from "@/services/expenseService";

// Expense categories with localized labels
const expenseCategories: { value: ExpenseCategory; label: string }[] = [
  { value: "Fixed Assets", label: "categories.fixedAssets" },
  { value: "Part-time Professors", label: "categories.partTimeProfessors" },
  {
    value: "Study Materials & Administration Leaves",
    label: "categories.studyMaterialsAdminLeaves",
  },
  { value: "Salaries", label: "categories.salaries" },
  { value: "Student Fees Refund", label: "categories.studentFeesRefund" },
  { value: "Advances", label: "categories.advances" },
  { value: "Bonuses", label: "categories.bonuses" },
  {
    value: "General & Administrative Expenses",
    label: "categories.generalAdminExpenses",
  },
  { value: "Library Supplies", label: "categories.librarySupplies" },
  { value: "Lab Consumables", label: "categories.labConsumables" },
  { value: "Student Training", label: "categories.studentTraining" },
  { value: "Saudi-Egyptian Company", label: "categories.saudiEgyptianCompany" },
];

const buildExpenseSchema = (t: (k: string) => string) =>
  z.object({
    description: z
      .string()
      .min(3, t("validation.descriptionMin"))
      .max(1000, t("validation.descriptionMax")),
    category: z.enum(
      [
        "Fixed Assets",
        "Part-time Professors",
        "Study Materials & Administration Leaves",
        "Salaries",
        "Student Fees Refund",
        "Advances",
        "Bonuses",
        "General & Administrative Expenses",
        "Library Supplies",
        "Lab Consumables",
        "Student Training",
        "Saudi-Egyptian Company",
      ] as const,
      {
        required_error: t("validation.categoryRequired"),
      }
    ),
    amount: z
      .string()
      .min(1, t("validation.amountRequired"))
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) > 0,
        t("validation.amountPositive")
      )
      .refine(
        (val) => Number(val) < 999999999999.99,
        t("validation.amountMax")
      ),
    vendor: z
      .string()
      .min(2, t("validation.vendorMin"))
      .max(255, t("validation.vendorMax"))
      .optional()
      .or(z.literal("")),
    receiptUrl: z
      .string()
      .url(t("validation.receiptUrlInvalid"))
      .max(500, t("validation.receiptUrlMax"))
      .optional()
      .or(z.literal("")),
    date: z
      .date({
        required_error: t("validation.dateRequired"),
      })
      .refine((date) => {
        const today = new Date();
        const selectedDate = new Date(date);

        // Set both dates to start/end of day for comparison
        today.setHours(23, 59, 59, 999); // End of today
        selectedDate.setHours(0, 0, 0, 0); // Start of selected date

        return selectedDate <= today;
      }, t("validation.dateFuture"))
      .refine((date) => {
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        tenYearsAgo.setHours(0, 0, 0, 0); // Start of that day 10 years ago

        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0); // Start of selected date

        return selectedDate >= tenYearsAgo;
      }, t("validation.dateTooOld")),
  });

type ExpenseFormData = z.infer<ReturnType<typeof buildExpenseSchema>>;

export type ExpenseSubmissionData = {
  description: string;
  category: ExpenseCategory;
  amount: string;
  vendor?: string;
  receiptUrl?: string;
  date: string; // ISO date string for API
};

interface ExpenseFormProps {
  onSubmit: (data: ExpenseSubmissionData) => void;
  onCancel: () => void;
}

export function ExpenseForm({ onSubmit, onCancel }: ExpenseFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(buildExpenseSchema(t)),
    defaultValues: {
      description: "",
      category: undefined,
      amount: "",
      vendor: "",
      receiptUrl: "",
      date: new Date(),
    },
  });

  const handleSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    try {
      // Format the data for API submission
      const submissionData: ExpenseSubmissionData = {
        description: data.description,
        category: data.category,
        amount: data.amount,
        date: data.date.toISOString().split("T")[0], // Convert to YYYY-MM-DD format
        vendor: data.vendor || undefined,
        receiptUrl: data.receiptUrl || undefined,
      };

      await onSubmit(submissionData);
      toast({
        title: t("success"),
        description: t("saveExpenseBtn"),
      });
      form.reset();
    } catch (error) {
      toast({
        title: t("error"),
        description: t("saveExpenseBtn"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("expenseDescription")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("descriptionPlaceholder")}
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expenseCategory")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("chooseCategory")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {t(category.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("amount")} ({t("sdg")})
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={t("amountPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Vendor */}
          <FormField
            control={form.control}
            name="vendor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vendorOptional")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("vendorPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("date")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ar })
                        ) : (
                          <span>{t("chooseDate")}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        const tenYearsAgo = new Date();
                        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
                        return date > new Date() || date < tenYearsAgo;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Receipt URL */}
        <FormField
          control={form.control}
          name="receiptUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("receiptUrlOptional")}</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder={t("receiptUrlPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex float-end gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-primary hover:opacity-90"
          >
            {isSubmitting ? t("saving") : t("saveExpenseBtn")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t("cancelBtn")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
