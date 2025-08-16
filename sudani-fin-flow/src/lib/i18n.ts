import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ar: {
    translation: {
      // Navigation
      "dashboard": "لوحة التحكم",
      "students": "الطلاب", 
      "payments": "المدفوعات",
      "expenses": "المصروفات",
      "reports": "التقارير",
      "settings": "الإعدادات",
      "logout": "تسجيل الخروج",
      
      // Authentication
      "login": "تسجيل الدخول",
      "username": "اسم المستخدم",
      "password": "كلمة المرور",
      "rememberMe": "تذكرني",
      "forgotPassword": "نسيت كلمة المرور؟",
      "welcomeBack": "مرحباً بعودتك",
      "loginSubtitle": "قم بتسجيل الدخول لإدارة النظام المالي",
      
      // Dashboard
      "totalRevenue": "إجمالي الإيرادات",
      "totalExpenses": "إجمالي المصروفات",
      "netProfit": "صافي الربح",
      "dailyTransactions": "المعاملات اليومية",
      "recentPayments": "المدفوعات الأخيرة",
      "recentExpenses": "المصروفات الأخيرة",
      "viewAll": "عرض الكل",
      
      // Students
      "studentManagement": "إدارة الطلاب",
      "addStudent": "إضافة طالب",
      "studentId": "الرقم الجامعي",
      "studentName": "اسم الطالب",
      "faculty": "الكلية",
      "department": "القسم",
      "academicYear": "السنة الدراسية",
      "phone": "رقم الهاتف",
      "email": "البريد الإلكتروني",
      "status": "الحالة",
      
      // Payments
      "paymentManagement": "إدارة المدفوعات",
      "addPayment": "تسجيل دفعة",
      "feeType": "نوع الرسوم",
      "amount": "المبلغ",
      "paymentMethod": "طريقة الدفع",
      "cash": "نقداً",
      "transfer": "تحويل",
      "check": "شيك",
      "referenceNumber": "رقم المرجع",
      "paymentDate": "تاريخ الدفع",
      "notes": "ملاحظات",
      "receipt": "إيصال",
      "printReceipt": "طباعة الإيصال",
      
      // Expenses
      "expenseManagement": "إدارة المصروفات",
      "addExpense": "تسجيل مصروف",
      "expenseCategory": "تصنيف المصروف",
      "vendor": "المورد",
      "invoiceNumber": "رقم الفاتورة",
      "expenseDate": "تاريخ المصروف",
      "description": "الوصف",
      "attachment": "مرفق",
      
      // Expense Categories
      "fixedAssets": "الاصول الثابتة",
      "cooperatingProfessors": "الأساتذة المتعاونون",
      "studyAndAdminRents": "ايجارات مقرات الدراسة والإدارة",
      "salaries": "المرتبات",
      "studentFeeRefunds": "استرداد رسوم للطلاب",
      "advances": "السلفيات",
      "bonuses": "مكافئات",
      "generalAndAdminExpenses": "المصروفات العمومية والادارية",
      "officeSupplies": "أدوات مكتبية",
      "labConsumables": "مستهلكات معامل",
      "studentTraining": "تدريب الطلاب",
      "saudiEgyptianCompany": "الشركة السعودية المصرية",
      
      // Reports
      "financialReports": "التقارير المالية",
      "dailyReport": "التقرير اليومي",
      "monthlyReport": "التقرير الشهري",
      "yearlyReport": "التقرير السنوي",
      "cashFlowReport": "تقرير التدفق النقدي",
      "expenseReport": "تقرير المصروفات",
      "studentPaymentReport": "تقرير مدفوعات الطلاب",
      
      // Common
      "save": "حفظ",
      "cancel": "إلغاء",
      "edit": "تعديل",
      "delete": "حذف",
      "search": "بحث",
      "filter": "تصفية",
      "date": "التاريخ",
      "total": "المجموع",
      "actions": "الإجراءات",
      "loading": "جاري التحميل...",
      "noData": "لا توجد بيانات",
      "success": "تم بنجاح",
      "error": "خطأ",
      "confirm": "تأكيد",
      "close": "إغلاق",
      
      // Dashboard specific
      "welcomeMessage": "مرحباً بك في النظام المالي",
      "welcomeSubtitle": "إدارة شاملة لجميع العمليات المالية بالجامعة الوطنية السودانية",
      "fromLastMonth": "من الشهر الماضي",
      "lastPayment": "آخر دفعة",
      "lastExpense": "آخر مصروف",
      "viewAllPayments": "عرض جميع المدفوعات", 
      "viewAllExpenses": "عرض جميع المصروفات",
      "quickActions": "إجراءات سريعة",
      "registerPayment": "تسجيل دفعة",
      "registerExpense": "تسجيل مصروف",
      "registerStudent": "إضافة طالب",
      "generateDailyReport": "تقرير يومي",
      "viewCashFlow": "التدفق النقدي",
      
      // Payments specific
      "paymentRecords": "سجل المدفوعات",
      "receiptNumber": "رقم الإيصال",
      "studentData": "بيانات الطالب",
      "paymentEmployee": "الموظف",
      "paymentStatus": "الحالة",
      "completed": "مكتمل",
      "pending": "معلق",
      "cancelled": "ملغي",
      "viewOnly": "عرض فقط",
      "todayTotal": "إجمالي المحصل اليوم",
      "completedTransactions": "عدد المعاملات المكتملة",
      "pendingTransactions": "معاملات معلقة",
      "totalAmount": "إجمالي المبلغ",
      "allStatuses": "جميع الحالات",
      "allMethods": "جميع الطرق",
      "advancedFilter": "تصفية متقدمة",
      "print": "طباعة",
      
      // Reports specific
      "overview": "نظرة عامة",
      "analytics": "تحليلات",
      "totalIncome": "إجمالي الإيرادات",
      "reportsIncome": "إجمالي الإيرادات",
      "reportsExpenses": "إجمالي المصروفات",
      "totalTransactions": "إجمالي المعاملات",
      "quickReports": "التقارير السريعة",
      "export": "تصدير",
      "view": "عرض",
      "download": "تحميل",
      "period": "الفترة",
      "income": "الإيرادات",
      "reportsExpensesCat": "المصروفات",
      "profit": "صافي الربح",
      "daily": "يومي",
      "weekly": "أسبوعي", 
      "monthly": "شهري",
      "yearly": "سنوي"
    }
  },
  en: {
    translation: {
      // Navigation
      "dashboard": "Dashboard",
      "students": "Students",
      "payments": "Payments", 
      "expenses": "Expenses",
      "reports": "Reports",
      "settings": "Settings",
      "logout": "Logout",
      
      // Authentication
      "login": "Login",
      "username": "Username",
      "password": "Password",
      "rememberMe": "Remember me",
      "forgotPassword": "Forgot password?",
      "welcomeBack": "Welcome back",
      "loginSubtitle": "Sign in to manage the financial system",
      
      // Dashboard
      "totalRevenue": "Total Revenue",
      "totalExpenses": "Total Expenses",
      "netProfit": "Net Profit",
      "dailyTransactions": "Daily Transactions",
      "recentPayments": "Recent Payments",
      "recentExpenses": "Recent Expenses",
      "viewAll": "View All",
      
      // Students
      "studentManagement": "Student Management",
      "addStudent": "Add Student",
      "studentId": "Student ID",
      "studentName": "Student Name",
      "faculty": "Faculty",
      "department": "Department",
      "academicYear": "Academic Year",
      "phone": "Phone",
      "email": "Email",
      "status": "Status",
      
      // Payments
      "paymentManagement": "Payment Management",
      "addPayment": "Add Payment",
      "feeType": "Fee Type",
      "amount": "Amount",
      "paymentMethod": "Payment Method",
      "cash": "Cash",
      "transfer": "Transfer",
      "check": "Check",
      "referenceNumber": "Reference Number",
      "paymentDate": "Payment Date",
      "notes": "Notes",
      "receipt": "Receipt",
      "printReceipt": "Print Receipt",
      
      // Expenses
      "expenseManagement": "Expense Management",
      "addExpense": "Add Expense",
      "expenseCategory": "Expense Category",
      "vendor": "Vendor",
      "invoiceNumber": "Invoice Number",
      "expenseDate": "Expense Date",
      "description": "Description",
      "attachment": "Attachment",
      
      // Expense Categories
      "fixedAssets": "Fixed Assets",
      "cooperatingProfessors": "Cooperating Professors",
      "studyAndAdminRents": "Study and Administration Rent",
      "salaries": "Salaries",
      "studentFeeRefunds": "Student Fee Refunds",
      "advances": "Advances",
      "bonuses": "Bonuses",
      "generalAndAdminExpenses": "General and Administrative Expenses",
      "officeSupplies": "Office Supplies",
      "labConsumables": "Lab Consumables",
      "studentTraining": "Student Training",
      "saudiEgyptianCompany": "Saudi Egyptian Company",
      
      // Reports
      "financialReports": "Financial Reports",
      "dailyReport": "Daily Report",
      "monthlyReport": "Monthly Report",
      "yearlyReport": "Yearly Report",
      "cashFlowReport": "Cash Flow Report",
      "expenseReport": "Expense Report",
      "studentPaymentReport": "Student Payment Report",
      
      // Common
      "save": "Save",
      "cancel": "Cancel",
      "edit": "Edit",
      "delete": "Delete",
      "search": "Search",
      "filter": "Filter",
      "date": "Date",
      "total": "Total",
      "actions": "Actions",
      "loading": "Loading...",
      "noData": "No data available",
      "success": "Success",
      "error": "Error",
      "confirm": "Confirm",
      "close": "Close",
      
      // Dashboard specific
      "welcomeMessage": "Welcome to the Financial System",
      "welcomeSubtitle": "Comprehensive management of all financial operations at the National University of Sudan",
      "fromLastMonth": "from last month",
      "lastPayment": "Last Payment",
      "lastExpense": "Last Expense",
      "viewAllPayments": "View All Payments",
      "viewAllExpenses": "View All Expenses", 
      "quickActions": "Quick Actions",
      "registerPayment": "Add Payment",
      "registerExpense": "Add Expense", 
      "registerStudent": "Add Student",
      "generateDailyReport": "Daily Report",
      "viewCashFlow": "Cash Flow",
      
      // Payments specific
      "paymentRecords": "Payment Records",
      "receiptNumber": "Receipt Number",
      "studentData": "Student Data",
      "paymentEmployee": "Employee",
      "paymentStatus": "Status",
      "completed": "Completed",
      "pending": "Pending",
      "cancelled": "Cancelled",
      "viewOnly": "View Only",
      "todayTotal": "Today's Total Collected",
      "completedTransactions": "Completed Transactions",
      "pendingTransactions": "Pending Transactions",
      "totalAmount": "Total Amount",
      "allStatuses": "All Statuses",
      "allMethods": "All Methods",
      "advancedFilter": "Advanced Filter",
      "print": "Print",
      
      // Reports specific
      "overview": "Overview",
      "analytics": "Analytics",
      "totalIncome": "Total Income",
      "reportsIncome": "Total Income",
      "reportsExpenses": "Total Expenses",
      "totalTransactions": "Total Transactions",
      "quickReports": "Quick Reports",
      "export": "Export",
      "view": "View",
      "download": "Download",
      "period": "Period",
      "income": "Income",
      "reportsExpensesCat": "Expenses",
      "profit": "Net Profit",
      "daily": "Daily",
      "weekly": "Weekly",
      "monthly": "Monthly", 
      "yearly": "Yearly"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar', // default language
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;