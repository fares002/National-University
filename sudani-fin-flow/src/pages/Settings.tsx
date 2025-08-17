import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  Shield,
  Settings as SettingsIcon,
  Eye,
  Edit,
  Trash2,
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

// Mock users data
const mockUsers = [
  {
    id: "1",
    username: "ahmed_admin",
    email: "ahmed@university.edu.sd",
    role: "admin",
    status: "active",
    lastLogin: "2024-01-15 10:30",
    createdAt: "2023-09-01",
  },
  {
    id: "2",
    username: "fatima_auditor",
    email: "fatima@university.edu.sd",
    role: "auditor",
    status: "active",
    lastLogin: "2024-01-15 09:15",
    createdAt: "2023-09-15",
  },
  {
    id: "3",
    username: "mohamed_admin",
    email: "mohamed@university.edu.sd",
    role: "admin",
    status: "active",
    lastLogin: "2024-01-14 16:45",
    createdAt: "2023-10-01",
  },
  {
    id: "4",
    username: "sara_auditor",
    email: "sara@university.edu.sd",
    role: "auditor",
    status: "inactive",
    lastLogin: "2024-01-10 14:20",
    createdAt: "2023-11-01",
  },
];

export function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState(mockUsers);
  const [selectedUser, setSelectedUser] = useState<string>("");

  const isAdmin = user?.role === "admin";

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

  const getStatusBadgeColor = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
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

    setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));

    toast({
      title: t("updated"),
      description: t("roleUpdated"),
    });
  };

  const handleStatusChange = (userId: string, newStatus: string) => {
    if (!isAdmin) {
      toast({
        title: t("notAllowed"),
        description: t("noPermissionChangeStatus"),
        variant: "destructive",
      });
      return;
    }

    setUsers(
      users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );

    toast({
      title: t("updated"),
      description: t("statusUpdated"),
    });
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

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">{t("usersManagement")}</TabsTrigger>
          <TabsTrigger value="permissions">{t("permissionsTab")}</TabsTrigger>
          <TabsTrigger value="system">{t("systemTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("usersList")}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                        <p className="text-xs text-muted-foreground">
                          {t("lastLogin")}: {user.lastLogin}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        <br />
                        <Badge
                          className={`${getStatusBadgeColor(user.status)} mt-1`}
                        >
                          {user.status === "active"
                            ? t("active")
                            : t("inactive")}
                        </Badge>
                      </div>

                      <div className="flex flex-col gap-2">
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

                        <Select
                          value={user.status}
                          onValueChange={(value) =>
                            handleStatusChange(user.id, value)
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">
                              {t("active")}
                            </SelectItem>
                            <SelectItem value="inactive">
                              {t("inactive")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("permissionsTab")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg font-medium">
                  <div>{t("reports")}</div>
                  <div className="text-center">{t("role.admin")}</div>
                  <div className="text-center">{t("accountant")}</div>
                  <div className="text-center">{t("financeOfficer")}</div>
                  <div className="text-center">{t("role.auditor")}</div>
                </div>

                {[
                  {
                    page: t("dashboard"),
                    admin: "✅",
                    accountant: "✅",
                    finance: "✅",
                    auditor: "✅",
                  },
                  {
                    page: `${t("payments")} - ${t("view")}`,
                    admin: "✅",
                    accountant: "✅",
                    finance: "✅",
                    auditor: "✅",
                  },
                  {
                    page: `${t("payments")} - ${t("edit")}`,
                    admin: "✅",
                    accountant: "✅",
                    finance: "❌",
                    auditor: "❌",
                  },
                  {
                    page: `${t("expenses")} - ${t("view")}`,
                    admin: "✅",
                    accountant: "✅",
                    finance: "✅",
                    auditor: "✅",
                  },
                  {
                    page: `${t("expenses")} - ${t("edit")}`,
                    admin: "✅",
                    accountant: "✅",
                    finance: "❌",
                    auditor: "❌",
                  },
                  {
                    page: t("reports"),
                    admin: "✅",
                    accountant: "✅",
                    finance: "✅",
                    auditor: "✅",
                  },
                  {
                    page: t("usersManagement"),
                    admin: "✅",
                    accountant: "❌",
                    finance: "❌",
                    auditor: "❌",
                  },
                ].map((perm, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-5 gap-4 p-4 border rounded-lg"
                  >
                    <div className="font-medium">{perm.page}</div>
                    <div className="text-center">{perm.admin}</div>
                    <div className="text-center">{perm.accountant}</div>
                    <div className="text-center">{perm.finance}</div>
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
              <CardTitle>{t("systemSettings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="university-name">{t("universityName")}</Label>
                  <Input
                    id="university-name"
                    defaultValue="National University of Sudan"
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
