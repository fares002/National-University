import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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

const paymentSchema = z.object({
  studentId: z.string().min(1, "الرقم الجامعي مطلوب"),
  studentName: z
    .string()
    .min(2, "اسم الطالب مطلوب")
    .max(100, "اسم الطالب طويل جداً"),
  feeType: z.enum(
    ["NEW_YEAR", "SUPPLEMENTARY", "LAB", "STUDENT_SERVICES", "OTHER", "EXAM"],
    {
      required_error: "نوع الرسوم مطلوب",
    }
  ),
  amount: z
    .string()
    .min(1, "المبلغ مطلوب")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "المبلغ يجب أن يكون رقماً موجباً"
    )
    .refine((val) => Number(val) <= 999999.99, "المبلغ كبير جداً"),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CHEQUE"], {
    required_error: "طريقة الدفع مطلوبة",
  }),
  paymentDate: z
    .date({
      required_error: "تاريخ الدفع مطلوب",
    })
    .refine(
      (date) => date <= new Date(),
      "لا يمكن أن يكون التاريخ في المستقبل"
    ),
  notes: z.string().max(500, "الملاحظات طويلة جداً").optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

// Extended type that includes the auto-generated receipt number
export type PaymentSubmissionData = PaymentFormData & {
  receiptNumber: string;
};

interface PaymentFormProps {
  onSubmit: (data: PaymentSubmissionData) => void;
  onCancel: () => void;
}

export function PaymentForm({ onSubmit, onCancel }: PaymentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate receipt number
  const generateReceiptNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const timestamp = now.getTime().toString().slice(-6); // Last 6 digits of timestamp
    return `RCP-${year}-${timestamp}`;
  };

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
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
      // Generate receipt number automatically
      const receiptNumber = generateReceiptNumber();

      // Add receipt number to the data
      const dataWithReceiptNumber = {
        ...data,
        receiptNumber,
      };

      await onSubmit(dataWithReceiptNumber);
      toast({
        title: "تم تسجيل الدفعة بنجاح",
        description: "تم إضافة الدفعة الجديدة إلى النظام",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الدفعة",
        description: "حدث خطأ أثناء تسجيل الدفعة، يرجى المحاولة مرة أخرى",
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
                <FormLabel>الرقم الجامعي</FormLabel>
                <FormControl>
                  <Input placeholder="أدخل الرقم الجامعي" {...field} />
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
                <FormLabel>اسم الطالب</FormLabel>
                <FormControl>
                  <Input placeholder="أدخل اسم الطالب" {...field} />
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
                <FormLabel>نوع الرسوم</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الرسوم" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NEW_YEAR">رسوم سنة جديدة</SelectItem>
                    <SelectItem value="SUPPLEMENTARY">رسوم ملحق</SelectItem>
                    <SelectItem value="LAB">رسوم مختبر</SelectItem>
                    <SelectItem value="STUDENT_SERVICES">
                      رسوم خدمات طلابية
                    </SelectItem>
                    <SelectItem value="EXAM">رسوم امتحانات</SelectItem>
                    <SelectItem value="OTHER">رسوم أخرى</SelectItem>
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
                <FormLabel>المبلغ (ج.س)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="أدخل المبلغ"
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
                <FormLabel>طريقة الدفع</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CASH">نقداً</SelectItem>
                    <SelectItem value="TRANSFER">تحويل بنكي</SelectItem>
                    <SelectItem value="CHEQUE">شيك</SelectItem>
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
                <FormLabel>تاريخ الدفع</FormLabel>
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
                          <span>اختر التاريخ</span>
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
              <FormLabel>ملاحظات (اختياري)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="أدخل أي ملاحظات إضافية"
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
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-primary hover:opacity-90"
          >
            {isSubmitting ? "جاري التسجيل..." : "تسجيل الدفعة"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
