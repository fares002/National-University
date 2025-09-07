import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  Shield,
  Trash2,
  Plus,
  DollarSign,
  History,
  RefreshCw,
} from "lucide-react";
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
  AlertDialogTrigger,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { currencyService } from "@/services/currencyService";
import { userService } from "@/services/userService";
import { UserForm, UserFormData } from "@/components/forms/UserForm";
import i18n from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";

type Role = "admin" | "auditor";

export function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<
    {
      id: string;
      username: string;
      email: string;
      role: Role;
      lastLoginAt: string;
    }[]
  >([]);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    id?: string;
  }>({ open: false });
  // Currency state
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [rateUpdatedAt, setRateUpdatedAt] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingRate, setLoadingRate] = useState(false);
  const [newRate, setNewRate] = useState("");
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const { dir } = useLanguage();

  const isAdmin = user?.role === "admin";

  const loadUsers = async () => {
    if (!isAdmin) return;
    try {
      const res = await userService.getAll(1, 100);
      setUsers(res.users as any);
      console.log(users);
    } catch (e: any) {
      toast({
        title: t("error"),
        description: e.message || String(e),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    loadUsers();
    if (isAdmin) {
      fetchCurrencyData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCurrencyData = async () => {
    try {
      setLoadingRate(true);
      const rate = await currencyService.getCurrent();
      setCurrentRate(rate.rate);
      setRateUpdatedAt(rate.updatedAt || rate.createdAt);
      const hist = await currencyService.getHistory(15);
      setHistory(hist);
    } catch (e: any) {
      toast({
        title: t("error"),
        description: e.message || String(e),
        variant: "destructive",
      });
    } finally {
      setLoadingRate(false);
    }
  };

  const handleSetRate = async () => {
    if (!newRate) return;
    const parsed = Number(newRate);
    if (isNaN(parsed) || parsed <= 0) {
      toast({
        title: t("error"),
        description: t("setRateError"),
        variant: "destructive",
      });
      return;
    }
    try {
      setLoadingRate(true);
      const updated = await currencyService.setRate(parsed);
      toast({ title: t("setRateSuccess") });
      setCurrentRate(updated.rate);
      setRateUpdatedAt(updated.updatedAt || updated.createdAt);
      setNewRate("");
      fetchCurrencyData();
      setRateDialogOpen(false);
    } catch (e: any) {
      toast({
        title: t("error"),
        description: t("setRateError"),
        variant: "destructive",
      });
    } finally {
      setLoadingRate(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return t("role.admin");
      case "auditor":
        return t("role.auditor");
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
        title: t("notAllowed"),
        description: t("noPermissionChangeRoles"),
        variant: "destructive",
      });
      return;
    }
    userService
      .updateRole(userId, newRole as Role)
      .then(() => {
        toast({
          title: t("updated"),
          description: t("roleUpdated"),
        });
        loadUsers();
      })
      .catch((e) =>
        toast({
          title: t("error"),
          description: e.message || String(e),
          variant: "destructive",
        })
      );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t("accessRestricted")}
          </h2>
          <p className="text-muted-foreground">{t("noPermissionSettings")}</p>
          <p className="text-sm text-muted-foreground mt-2">{t("adminOnly")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          {t("systemSettings")}
        </h1>
        <Badge className="bg-primary text-primary-foreground">
          <Shield className="h-3 w-3 mr-1" />
          {t("adminPrivileges")}
        </Badge>
      </div>

      <Tabs defaultValue="users" className="space-y-6" dir={dir}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">{t("usersManagement")}</TabsTrigger>
          <TabsTrigger value="permissions">{t("permissionsTab")}</TabsTrigger>
          <TabsTrigger value="system">{t("systemTab")}</TabsTrigger>
          <TabsTrigger value="currency">{t("currencyTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="currency" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" /> {t("currencyTab")}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCurrencyData}
                  disabled={loadingRate}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-1 ${
                      loadingRate ? "animate-spin" : ""
                    }`}
                  />
                  {t("refresh")}
                </Button>
                {isAdmin && (
                  <Dialog
                    open={rateDialogOpen}
                    onOpenChange={setRateDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        className="bg-gradient-primary hover:opacity-90"
                        size="sm"
                      >
                        {t("updateRate")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>{t("updateRate")}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={newRate}
                          onChange={(e) => setNewRate(e.target.value)}
                          placeholder={t("newRatePlaceholder") || ""}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              disabled={!newRate}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {t("confirmSetRate")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("confirmSetRate")}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("confirmSetRateDesc")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t("cancelBtn")}
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={handleSetRate}>
                                {t("updateRate")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg bg-muted/40 flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    {t("currentRate")}
                  </span>
                  <span className="text-2xl font-bold mt-1">
                    {currentRate ? currentRate.toFixed(2) : "--"} {t("sdg")} / 1{" "}
                    {t("usd")}
                  </span>
                </div>
                <div className="p-4 border rounded-lg bg-muted/40 flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    {t("lastUpdated")}
                  </span>
                  <span className="text-sm font-medium mt-1">
                    {rateUpdatedAt ? formatDate(rateUpdatedAt) : "--"}
                  </span>
                </div>
                <div className="p-4 border rounded-lg bg-muted/40 flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    {t("rateHistory")}
                  </span>
                  <span className="text-sm font-medium mt-1">
                    {history.length}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <History className="h-4 w-4" /> {t("rateHistory")}
                </h3>
                <div className="overflow-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-2 text-right font-medium">#</th>
                        <th className="p-2 text-right font-medium">
                          {t("rate")}
                        </th>
                        <th className="p-2 text-right font-medium">
                          {t("validFrom")}
                        </th>
                        <th className="p-2 text-right font-medium">
                          {t("lastUpdated")}
                        </th>
                        <th className="p-2 text-right font-medium">
                          {t("status")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-4 text-center text-muted-foreground"
                          >
                            {t("noHistory")}
                          </td>
                        </tr>
                      )}
                      {history.map((r, idx) => (
                        <tr key={r.id} className="border-t hover:bg-muted/30">
                          <td className="p-2 align-middle">{idx + 1}</td>
                          <td className="p-2 align-middle font-medium">
                            {Number(r.rate).toFixed(2)}
                          </td>
                          <td className="p-2 align-middle">
                            {formatDate(r.validFrom)}
                          </td>
                          <td className="p-2 align-middle">
                            {formatDate(r.updatedAt || r.createdAt)}
                          </td>
                          <td className="p-2 align-middle">
                            {r.isActive ? (
                              <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                                {t("active")}
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                                {t("inactive")}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("usersList")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-gradient-primary inline-flex items-center"
                      onClick={() => setAddOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("addUser")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{t("addUser")}</DialogTitle>
                    </DialogHeader>
                    <UserForm
                      onSubmit={async (data: UserFormData) => {
                        try {
                          await userService.create(data as any);
                          toast({
                            title: t("success"),
                            description: t("userAdded"),
                          });
                          setAddOpen(false);
                          loadUsers();
                        } catch (e: any) {
                          // Try to extract express-validator or backend error message
                          const backendMsg =
                            e?.response?.data?.message ||
                            e?.response?.data?.error;
                          toast({
                            title: t("error"),
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
                        <p className="text-sm text-muted-foreground flex">
                          {user.lastLoginAt
                            ? formatDate(user.lastLoginAt)
                            : t("neverLoggedIn")}
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
                            <SelectItem value="admin">
                              {t("role.admin")}
                            </SelectItem>
                            <SelectItem value="auditor">
                              {t("role.auditor")}
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="destructive"
                          size="icon"
                          aria-label={t("delete")}
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
                    <AlertDialogTitle>
                      {t("confirmDeleteTitle")}
                    </AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancelBtn")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          if (confirmDelete.id) {
                            await userService.remove(confirmDelete.id);
                            toast({
                              title: t("deleted"),
                              description: t("userDeleted"),
                            });
                            loadUsers();
                          }
                        } catch (e: any) {
                          toast({
                            title: t("error"),
                            description: e.message || String(e),
                            variant: "destructive",
                          });
                        } finally {
                          setConfirmDelete({ open: false });
                        }
                      }}
                    >
                      {t("confirm")}
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
              <CardTitle>{t("permissionsMatrix")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg font-medium">
                  <div>{t("pageFeature")}</div>
                  <div className="text-center">{t("role.admin")}</div>
                  <div className="text-center">{t("role.auditor")}</div>
                </div>

                {[
                  {
                    page: t("dashboard"),
                    admin: "✅",
                    auditor: "✅",
                  },
                  {
                    page: `${t("payments")} - ${t("view")}`,
                    admin: "✅",
                    auditor: "✅",
                  },
                  {
                    page: `${t("payments")} - ${t("edit")}`,
                    admin: "✅",
                    auditor: "❌",
                  },
                  {
                    page: `${t("expenses")} - ${t("view")}`,
                    admin: "✅",
                    auditor: "✅",
                  },
                  {
                    page: `${t("expenses")} - ${t("edit")}`,
                    admin: "✅",
                    auditor: "❌",
                  },
                  {
                    page: t("reports"),
                    admin: "✅",
                    auditor: "✅",
                  },
                  {
                    page: t("usersManagement"),
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
              <CardTitle>{t("generalSettings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="university-name">{t("universityName")}</Label>
                  <Input
                    id="university-name"
                    defaultValue="الجامعة الوطنية السودانية"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="system-version">{t("systemVersion")}</Label>
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
                  {t("saveSettings")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
