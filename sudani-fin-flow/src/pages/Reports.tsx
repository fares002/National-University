import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download, Calendar, DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart as LucidePieChart, Eye, Filter, Search, PrinterIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

// Mock data for reports
const mockReports = [
  {
    id: '1',
    name: 'التقرير المالي اليومي',
    type: 'daily',
    date: '2024-01-15',
    totalIncome: 450000,
    totalExpenses: 125000,
    netProfit: 325000,
    transactions: 28
  },
  {
    id: '2',
    name: 'التقرير المالي الأسبوعي',
    type: 'weekly',
    date: '2024-01-08 - 2024-01-14',
    totalIncome: 2850000,
    totalExpenses: 875000,
    netProfit: 1975000,
    transactions: 156
  },
  {
    id: '3',
    name: 'التقرير المالي الشهري',
    type: 'monthly',
    date: 'ديسمبر 2023',
    totalIncome: 12500000,
    totalExpenses: 4200000,
    netProfit: 8300000,
    transactions: 678
  }
];

const incomeByCategory = [
  { category: 'رسوم سنة جديدة', amount: 8500000, percentage: 68 },
  { category: 'رسوم ملحق', amount: 2200000, percentage: 18 },
  { category: 'رسوم مختبر', amount: 1100000, percentage: 9 },
  { category: 'رسوم خدمات طلابية', amount: 700000, percentage: 5 }
];

const expenseByCategory = [
  { category: 'مصروفات تشغيلية', amount: 1800000, percentage: 43 },
  { category: 'مصروفات إدارية', amount: 1250000, percentage: 30 },
  { category: 'مرافق عامة', amount: 750000, percentage: 18 },
  { category: 'خدمات خارجية', amount: 400000, percentage: 9 }
];

// Chart data
const monthlyData = [
  { month: 'يناير', income: 12500000, expenses: 4200000, profit: 8300000 },
  { month: 'فبراير', income: 11800000, expenses: 3950000, profit: 7850000 },
  { month: 'مارس', income: 13200000, expenses: 4600000, profit: 8600000 },
  { month: 'أبريل', income: 14100000, expenses: 4800000, profit: 9300000 },
  { month: 'مايو', income: 12900000, expenses: 4300000, profit: 8600000 },
  { month: 'يونيو', income: 13800000, expenses: 4700000, profit: 9100000 }
];

const pieChartData = [
  { name: 'رسوم سنة جديدة', value: 68, amount: 8500000, fill: '#10b981' },
  { name: 'رسوم ملحق', value: 18, amount: 2200000, fill: '#3b82f6' },
  { name: 'رسوم مختبر', value: 9, amount: 1100000, fill: '#f59e0b' },
  { name: 'رسوم خدمات طلابية', value: 5, amount: 700000, fill: '#ef4444' }
];

const detailedReports = [
  { id: '1', type: 'التقرير المالي الشامل', date: '2024-01-15', status: 'مكتمل', size: '2.5 MB' },
  { id: '2', type: 'تقرير الإيرادات حسب الفئة', date: '2024-01-14', status: 'مكتمل', size: '1.8 MB' },
  { id: '3', type: 'تقرير المصروفات التفصيلي', date: '2024-01-13', status: 'قيد الإعداد', size: '2.1 MB' },
  { id: '4', type: 'تقرير التدفق النقدي', date: '2024-01-12', status: 'مكتمل', size: '1.2 MB' },
  { id: '5', type: 'تقرير مقارن سنوي', date: '2024-01-11', status: 'مكتمل', size: '3.4 MB' }
];

const chartConfig = {
  income: {
    label: "الإيرادات",
    color: "#10b981",
  },
  expenses: {
    label: "المصروفات", 
    color: "#ef4444",
  },
  profit: {
    label: "صافي الربح",
    color: "#3b82f6",
  },
};

export function Reports() {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedReport, setSelectedReport] = useState('financial');
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SD').format(amount);
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Calendar className="h-4 w-4" />;
      case 'weekly': return <BarChart3 className="h-4 w-4" />;
      case 'monthly': return <LucidePieChart className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getReportColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="نوع التقرير" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financial">التقارير المالية</SelectItem>
              <SelectItem value="income">تقارير الإيرادات</SelectItem>
              <SelectItem value="expense">تقارير المصروفات</SelectItem>
              <SelectItem value="cashflow">تقارير التدفق النقدي</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="الفترة الزمنية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">يومي</SelectItem>
              <SelectItem value="weekly">أسبوعي</SelectItem>
              <SelectItem value="monthly">شهري</SelectItem>
              <SelectItem value="yearly">سنوي</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            تصفية
          </Button>
          <Button variant="outline">
            <PrinterIcon className="h-4 w-4 mr-2" />
            طباعة
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="analytics">تحليلات</TabsTrigger>
          <TabsTrigger value="income">الإيرادات</TabsTrigger>
          <TabsTrigger value="expenses">المصروفات</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</p>
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(12500000)} ج.س
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 text-success mr-1" />
                      <span className="text-sm text-success">+12.5%</span>
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">إجمالي المصروفات</p>
                    <p className="text-2xl font-bold text-destructive">
                      {formatCurrency(4200000)} ج.س
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendingDown className="h-4 w-4 text-success mr-1" />
                      <span className="text-sm text-success">-3.2%</span>
                    </div>
                  </div>
                  <TrendingDown className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">صافي الربح</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(8300000)} ج.س
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 text-success mr-1" />
                      <span className="text-sm text-success">+18.7%</span>
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">إجمالي المعاملات</p>
                    <p className="text-2xl font-bold text-foreground">678</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 text-success mr-1" />
                      <span className="text-sm text-success">+45</span>
                    </div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Reports */}
          <Card>
            <CardHeader>
              <CardTitle>التقارير السريعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {mockReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getReportIcon(report.type)}
                        <h3 className="font-medium text-sm">{report.name}</h3>
                      </div>
                      <Badge className={getReportColor(report.type)}>
                        {report.type === 'daily' && 'يومي'}
                        {report.type === 'weekly' && 'أسبوعي'}
                        {report.type === 'monthly' && 'شهري'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الفترة:</span>
                        <span>{report.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الإيرادات:</span>
                        <span className="text-success">+{formatCurrency(report.totalIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">المصروفات:</span>
                        <span className="text-destructive">-{formatCurrency(report.totalExpenses)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>صافي الربح:</span>
                        <span className="text-primary">{formatCurrency(report.netProfit)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        عرض
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-3 w-3 mr-1" />
                        تحميل
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>اتجاه الإيرادات والمصروفات</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
                      <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.8} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع الإيرادات حسب المصدر</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>مؤشرات الأداء</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>معدل النمو الشهري</span>
                    <span className="font-medium text-success">+12.5%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>هامش الربح</span>
                    <span className="font-medium text-primary">66.4%</span>
                  </div>
                  <Progress value={66} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>معدل السيولة</span>
                    <span className="font-medium text-warning">85.2%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>تحليل الإيرادات حسب التصنيف</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incomeByCategory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-success rounded-full" />
                        <span className="font-medium text-sm">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-success">{formatCurrency(item.amount)} ج.س</p>
                        <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>اتجاه الإيرادات الشهري</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>تحليل المصروفات حسب التصنيف</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseByCategory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-destructive rounded-full" />
                        <span className="font-medium text-sm">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-destructive">{formatCurrency(item.amount)} ج.س</p>
                        <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>مقارنة المصروفات الشهرية</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="expenses" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>مكتبة التقارير المحفوظة</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث في التقارير..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    إنشاء تقرير جديد
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نوع التقرير</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الحجم</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailedReports
                    .filter(report => 
                      searchTerm === '' || 
                      report.type.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.type}</TableCell>
                      <TableCell>{report.date}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={report.status === 'مكتمل' ? 'default' : 'secondary'}
                          className={report.status === 'مكتمل' ? 'bg-success' : ''}
                        >
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{report.size}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <PrinterIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}