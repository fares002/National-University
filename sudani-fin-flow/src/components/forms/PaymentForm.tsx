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
import { Label } from "@/components/ui/label";
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
import {
  STUDENT_NAME_MIN,
  STUDENT_NAME_MAX,
  AMOUNT_MAX,
  NOTES_MAX,
} from "./validation";

const buildPaymentSchema = (t: any) =>
  z.object({
    studentId: z.string().min(1, t("validation.studentIdRequired")),
    studentName: z
      .string()
      .min(STUDENT_NAME_MIN, t("validation.studentNameRequired"))
      .max(STUDENT_NAME_MAX, t("validation.studentNameMax")),
    feeType: z.enum(
      ["NEW_YEAR", "SUPPLEMENTARY", "LAB", "STUDENT_SERVICES", "OTHER", "EXAM"],
      {
        required_error: t("validation.feeTypeRequired"),
      }
    ),
    amount: z
      .string()
      .min(1, t("validation.amountRequired"))
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) > 0,
        t("validation.amountPositive")
      )
      .refine((val) => Number(val) <= AMOUNT_MAX, t("validation.amountMax")),
    paymentMethod: z.enum(["CASH", "TRANSFER", "CHEQUE"], {
      required_error: t("validation.paymentMethodRequired"),
    }),
    paymentDate: z
      .date({
        required_error: t("validation.paymentDateRequired"),
      })
      .refine((date) => {
        const today = new Date();
        const selectedDate = new Date(date);

        // Set both dates to start of day for comparison
        today.setHours(23, 59, 59, 999); // End of today
        selectedDate.setHours(0, 0, 0, 0); // Start of selected date

        return selectedDate <= today;
      }, t("validation.paymentDateFuture")),
    notes: z.string().max(NOTES_MAX, t("validation.notesMax")).optional(),
  });

type PaymentFormData = z.infer<ReturnType<typeof buildPaymentSchema>>;

// Extended type that includes the auto-generated receipt number
export type PaymentSubmissionData = PaymentFormData & {
  receiptNumber: string;
};

interface PaymentFormProps {
  onSubmit: (data: PaymentSubmissionData) => void;
  onCancel: () => void;
  // Optional: pre-populate form for editing
  initialValues?: Partial<PaymentSubmissionData>;
  isEdit?: boolean;
}

export function PaymentForm({
  onSubmit,
  onCancel,
  initialValues,
  isEdit = false,
}: PaymentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  // Generate receipt number
  const generateReceiptNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const timestamp = now.getTime().toString().slice(-6); // Last 6 digits of timestamp
    return `RCP-${year}-${timestamp}`;
  };

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(buildPaymentSchema(t)),
    defaultValues: initialValues
      ? {
          studentId: initialValues.studentId ?? "",
          studentName: initialValues.studentName ?? "",
          feeType: (initialValues.feeType as any) ?? undefined,
          amount: initialValues.amount ?? "",
          paymentMethod: (initialValues.paymentMethod as any) ?? undefined,
          paymentDate: initialValues.paymentDate
            ? new Date(initialValues.paymentDate as any)
            : new Date(),
          notes: initialValues.notes ?? "",
        }
      : {
          studentId: "",
          studentName: "",
          feeType: undefined,
          amount: "",
          paymentMethod: undefined,
          paymentDate: new Date(),
          notes: "",
        },
  });

  const handleSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        // For edit, don't generate a new receipt number; pass existing one if provided
        const dataWithReceiptNumber = {
          ...data,
          receiptNumber: initialValues?.receiptNumber || "",
        } as PaymentSubmissionData;
        await onSubmit(dataWithReceiptNumber);
      } else {
        // Generate receipt number automatically
        const receiptNumber = generateReceiptNumber();
        const dataWithReceiptNumber = {
          ...data,
          receiptNumber,
        };
        await onSubmit(dataWithReceiptNumber);
        toast({
          title: t("paymentSuccessTitle"),
          description: t("addNewPayment"),
        });
        form.reset();
      }
    } catch (error) {
      toast({
        title: t("paymentErrorTitle"),
        description: t("paymentErrorDescription"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Student ID */}
          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("studentId")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("enterStudentId")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Student Name */}
          <FormField
            control={form.control}
            name="studentName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("studentName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("enterStudentName")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fee Type */}
          <FormField
            control={form.control}
            name="feeType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("feeType")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("chooseFeeType")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NEW_YEAR">
                      {t("feeTypeNewYear")}
                    </SelectItem>
                    <SelectItem value="SUPPLEMENTARY">
                      {t("feeTypeSupplementary")}
                    </SelectItem>
                    <SelectItem value="LAB">{t("laboratory")}</SelectItem>
                    <SelectItem value="STUDENT_SERVICES">
                      {t("feeTypeStudentServices")}
                    </SelectItem>
                    <SelectItem value="EXAM">{t("feeTypeExam")}</SelectItem>
                    <SelectItem value="OTHER">{t("feeTypeOther")}</SelectItem>
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

          {/* Payment Method */}
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("paymentMethod")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("choosePaymentMethod")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CASH">
                      {t("paymentMethodCash")}
                    </SelectItem>
                    <SelectItem value="TRANSFER">
                      {t("paymentMethodTransfer")}
                    </SelectItem>
                    <SelectItem value="CHEQUE">
                      {t("paymentMethodCheque")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Payment Date */}
          <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("paymentDateLabel")}</FormLabel>
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
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("notesOptional")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("notesOptional")}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("cancelBtn")}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-primary hover:opacity-90"
          >
            {isSubmitting ? t("registering") : t("registerPaymentBtn")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
