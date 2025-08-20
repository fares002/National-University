import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Shield, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { userService } from "@/services/userService";
import { UserForm, UserFormData } from "@/components/forms/UserForm";

type Role = "admin" | "auditor";

export function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<
    { id: string; username: string; email: string; role: Role }[]
  >([]);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    id?: string;
  }>({ open: false });

  const isAdmin = user?.role === "admin";

  const loadUsers = async () => {
    if (!isAdmin) return;
    try {
      const res = await userService.getAll(1, 100);
      setUsers(res.users as any);
    } catch (e: any) {
      toast({
        title: "خطأ",
        description: e.message || String(e),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "مدير";
      case "auditor":
        return "مراجع";
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "auditor":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    if (!isAdmin) {
      toast({
        title: "غير مسموح",
        description: "ليس لديك صلاحية لتغيير الأدوار",
        variant: "destructive",
      });
      return;
    }
    userService
      .updateRole(userId, newRole as Role)
      .then(() => {
        toast({
          title: "تم التحديث",
          description: "تم تغيير دور المستخدم بنجاح",
        });
        loadUsers();
      })
      .catch((e) =>
        toast({
          title: "خطأ",
          description: e.message || String(e),
          variant: "destructive",
        })
      );
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            الوصول محدود
          </h2>
          <p className="text-muted-foreground">
            ليس لديك صلاحية للوصول إلى إعدادات النظام
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            يمكن للمدير المالي فقط الوصول لهذه الصفحة
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">إعدادات النظام</h1>
        <Badge className="bg-primary text-primary-foreground">
          <Shield className="h-3 w-3 mr-1" />
          صلاحيات المدير
        </Badge>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>
          <TabsTrigger value="permissions">الصلاحيات</TabsTrigger>
          <TabsTrigger value="system">إعدادات النظام</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                قائمة المستخدمين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-start mb-4">
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-gradient-primary inline-flex items-center"
                      onClick={() => setAddOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة مستخدم
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>إضافة مستخدم</DialogTitle>
                    </DialogHeader>
                    <UserForm
                      onSubmit={async (data: UserFormData) => {
                        try {
                          await userService.create(data as any);
                          toast({
                            title: "تم الحفظ",
                            description: "تم إضافة المستخدم بنجاح",
                          });
                          setAddOpen(false);
                          loadUsers();
                        } catch (e: any) {
                          // Try to extract express-validator or backend error message
                          const backendMsg = e?.response?.data?.message || e?.response?.data?.error;
                          toast({
                            title: "خطأ",
                            description: backendMsg || e.message || String(e),
                            variant: "destructive",
                          });
                        }
                      }}
                      onCancel={() => setAddOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {user.username}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        <br />
                      </div>

                      <div className="flex gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(value) =>
                            handleRoleChange(user.id, value)
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">مدير</SelectItem>
                            <SelectItem value="auditor">مراجع</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="destructive"
                          size="icon"
                          aria-label="حذف"
                          onClick={() =>
                            setConfirmDelete({ open: true, id: user.id })
                          }
                          className="bg-white hover:bg-gray-100"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <AlertDialog
                open={confirmDelete.open}
                onOpenChange={(open) => setConfirmDelete({ open })}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          if (confirmDelete.id) {
                            await userService.remove(confirmDelete.id);
                            toast({
                              title: "تم الحذف",
                              description: "تم حذف المستخدم",
                            });
                            loadUsers();
                          }
                        } catch (e: any) {
                          toast({
                            title: "خطأ",
                            description: e.message || String(e),
                            variant: "destructive",
                          });
                        } finally {
                          setConfirmDelete({ open: false });
                        }
                      }}
                    >
                      تأكيد
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>مصفوفة الصلاحيات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg font-medium">
                  <div>الصفحة/الوظيفة</div>
                  <div className="text-center">المدير المالي</div>
                  <div className="text-center">المراجع</div>
                </div>

                {[
                  {
                    page: "لوحة التحكم",
                    admin: "✅",
                    auditor: "✅",
                  },
                  {
                    page: "المدفوعات - عرض",
                    admin: "✅",
                    auditor: "✅",
                  },
                  {
                    page: "المدفوعات - تعديل",
                    admin: "✅",
                    auditor: "❌",
                  },
                  {
                    page: "المصروفات - عرض",
                    admin: "✅",
                    auditor: "✅",
                  },
                  {
                    page: "المصروفات - تعديل",
                    admin: "✅",
                    auditor: "❌",
                  },
                  {
                    page: "التقارير",
                    admin: "✅",
                    auditor: "✅",
                  },
                  {
                    page: "إدارة المستخدمين",
                    admin: "✅",
                    auditor: "❌",
                  },
                ].map((perm, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 gap-4 p-4 border rounded-lg"
                  >
                    <div className="font-medium">{perm.page}</div>
                    <div className="text-center">{perm.admin}</div>
                    <div className="text-center">{perm.auditor}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات عامة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="university-name">اسم الجامعة</Label>
                  <Input
                    id="university-name"
                    defaultValue="الجامعة الوطنية السودانية"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="system-version">إصدار النظام</Label>
                  <Input
                    id="system-version"
                    defaultValue="1.0.0"
                    className="mt-1"
                    disabled
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button className="bg-gradient-primary hover:opacity-90">
                  حفظ الإعدادات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
