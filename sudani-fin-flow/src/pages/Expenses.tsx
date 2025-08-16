import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Filter,
  Receipt,
  DollarSign,
  Calendar,
  Building,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Mock data for expenses
const mockExpenses = [
  {
    id: "1",
    description: "شراء قرطاسية ومواد مكتبية للمكاتب الإدارية",
    amount: 45000,
    category: "officeSupplies",
    vendor: "مكتبة النيل للقرطاسية",
    invoiceNumber: "INV-2024-001",
    date: "2024-01-15",
    paymentMethod: "نقداً",
    employee: "أحمد محمد الإداري",
  },
  {
    id: "2",
    description: "فاتورة كهرباء شهر ديسمبر 2023",
    amount: 125000,
    category: "generalAndAdminExpenses",
    vendor: "الشركة السودانية للكهرباء",
    invoiceNumber: "ELEC-2023-12",
    date: "2024-01-14",
    paymentMethod: "تحويل بنكي",
    employee: "فاطمة أحمد المحاسبة",
  },
  {
    id: "3",
    description: "صيانة أجهزة الحاسوب في قاعة الحاسوب الرئيسية",
    amount: 85000,
    category: "generalAndAdminExpenses",
    vendor: "شركة الخرطوم للحاسوب",
    invoiceNumber: "COMP-2024-003",
    date: "2024-01-13",
    paymentMethod: "شيك",
    employee: "محمد علي المالية",
  },
  {
    id: "4",
    description: "راتب موظف النظافة شهر يناير",
    amount: 75000,
    category: "salaries",
    vendor: "مباشر - راتب",
    invoiceNumber: "SAL-2024-001",
    date: "2024-01-12",
    paymentMethod: "نقداً",
    employee: "سارة حسن المراجعة",
  },
];

const expenseCategories = [
  "fixedAssets",
  "cooperatingProfessors",
  "studyAndAdminRents",
  "salaries",
  "studentFeeRefunds",
  "advances",
  "bonuses",
  "generalAndAdminExpenses",
  "officeSupplies",
  "labConsumables",
  "studentTraining",
  "saudiEgyptianCompany",
];

const paymentMethods = ["نقداً", "تحويل بنكي", "شيك"];

export function Expenses() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses] = useState(mockExpenses);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Check if user can edit (admin only for now, since API only has admin/auditor)
  const canEdit = user?.role === "admin";

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || expense.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const handleAddExpense = () => {
    toast({
      title: "تم إضافة المصروف",
      description: "تم تسجيل المصروف بنجاح",
    });
    setIsAddDialogOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SD").format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      fixedAssets: "bg-green-100 text-green-800",
      cooperatingProfessors: "bg-blue-100 text-blue-800",
      studyAndAdminRents: "bg-orange-100 text-orange-800",
      salaries: "bg-purple-100 text-purple-800",
      studentFeeRefunds: "bg-yellow-100 text-yellow-800",
      advances: "bg-indigo-100 text-indigo-800",
      bonuses: "bg-pink-100 text-pink-800",
      generalAndAdminExpenses: "bg-red-100 text-red-800",
      officeSupplies: "bg-cyan-100 text-cyan-800",
      labConsumables: "bg-teal-100 text-teal-800",
      studentTraining: "bg-lime-100 text-lime-800",
      saudiEgyptianCompany: "bg-amber-100 text-amber-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  إجمالي المصروفات اليوم
                </p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(totalExpenses)} ج.س
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  عدد المصروفات
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredExpenses.length}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  متوسط المصروف
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredExpenses.length > 0
                    ? formatCurrency(
                        Math.round(totalExpenses / filteredExpenses.length)
                      )
                    : "0"}{" "}
                  ج.س
                </p>
              </div>
              <Calendar className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="البحث في المصروفات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="فلترة حسب التصنيف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع التصنيفات</SelectItem>
              {expenseCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {t(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canEdit && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                إضافة مصروف
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة مصروف جديد</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddExpense();
                }}
              >
                <div>
                  <Label htmlFor="description">وصف المصروف</Label>
                  <Textarea
                    id="description"
                    placeholder="أدخل وصف تفصيلي للمصروف..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">التصنيف</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر تصنيف المصروف" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {t(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">المبلغ (ج.س)</Label>
                  <Input id="amount" type="number" placeholder="0" required />
                </div>

                <div>
                  <Label htmlFor="vendor">المورد</Label>
                  <Input
                    id="vendor"
                    placeholder="اسم المورد أو الجهة"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    حفظ المصروف
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {!canEdit && (
          <Badge variant="outline" className="text-muted-foreground">
            <Eye className="mr-1 h-3 w-3" />
            عرض فقط
          </Badge>
        )}
      </div>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            سجل المصروفات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-sm">
                      {expense.description}
                    </h3>
                    <Badge className={getCategoryColor(expense.category)}>
                      {t(expense.category)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {expense.vendor}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {expense.date}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    رقم الفاتورة: {expense.invoiceNumber} •{" "}
                    {expense.paymentMethod} • {expense.employee}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-destructive">
                    -{formatCurrency(expense.amount)} ج.س
                  </p>
                </div>
              </div>
            ))}

            {filteredExpenses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد مصروفات مطابقة لمعايير البحث
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
