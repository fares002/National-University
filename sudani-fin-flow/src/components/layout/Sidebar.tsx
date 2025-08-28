import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  FileText,
  Settings,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import image from "../../../public/national.ico"

const navigation = [
  { name: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "payments", href: "/payments", icon: CreditCard },
  { name: "expenses", href: "/expenses", icon: Receipt },
  { name: "reports", href: "/reports", icon: FileText },
  { name: "settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-primary shadow-strong">
      {/* University Header */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
          <img src={image} className="h-8 w-8 "/>
        </div>
        <div className="text-white">
          <h1 className="text-sm font-bold">{t("universityFullName")}</h1>
          <p className="text-xs opacity-80">{t("financialSystem")}</p>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="text-white">
          <p className="text-sm font-medium">{user?.username}</p>
          <p className="text-xs opacity-80">{user?.email}</p>
          <p className="text-xs opacity-60 mt-1">
            {user?.role ? t(`role.${user.role}`) : null}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-smooth",
                isActive
                  ? "bg-white/20 text-white shadow-soft"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {t(item.name)}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="border-t border-white/10 p-3">
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5" />
          {t("logout")}
        </Button>
      </div>
    </div>
  );
}
