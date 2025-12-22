"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Sprout,
  Leaf,
  MapPin,
  CloudRain,
  Droplets,
  Tractor,
  Beef,
  Package,
  DollarSign,
  BarChart3,
  Wrench,
  FileText,
  Settings,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  subItems?: NavItem[];
}

const navigation: NavItem[] = [
  {
    name: "Inicio",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Agronomía",
    href: "/dashboard/agronomia",
    icon: Sprout,
    subItems: [
      {
        name: "Campo Digital",
        href: "/dashboard/agronomia?tab=resumen",
        icon: Leaf,
      },
      {
        name: "Gestión de Lotes",
        href: "/dashboard/agronomia?tab=lotes",
        icon: MapPin,
      },
      {
        name: "Clima",
        href: "/dashboard/clima",
        icon: CloudRain,
      },
      {
        name: "Calculadora de Dosis",
        href: "/dashboard/herramientas-agricolas?tab=calculadora",
        icon: Droplets,
      },
      {
        name: "Plan de Riego",
        href: "/dashboard/agronomia/plan-riego",
        icon: Droplets,
        badge: "🔒",
      },
    ],
  },
  {
    name: "Ganadería",
    href: "/dashboard/ganaderia",
    icon: Beef,
  },
  {
    name: "Logística e Inventario",
    href: "/dashboard/inventario",
    icon: Package,
  },
  {
    name: "Finanzas",
    href: "/dashboard/finanzas",
    icon: DollarSign,
  },
  {
    name: "Maquinaria y MTM",
    href: "/dashboard/maquinaria",
    icon: Tractor,
  },
  {
    name: "Sostenibilidad",
    href: "/dashboard/sostenibilidad",
    icon: Leaf,
  },
  {
    name: "Calendario",
    href: "/dashboard/calendario",
    icon: FileText,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Agronomía"]);

  const toggleExpand = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const isSubItemActive = (subHref: string) => {
    return pathname.includes(subHref.split("?")[0]);
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white">
      {/* LOGO */}
      <div className="flex h-16 items-center justify-center border-b px-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-green-500" />
          <div>
            <h1 className="font-bold text-lg">MiCampo</h1>
            <p className="text-xs text-gray-600">Bienvenido,</p>
            <p className="text-xs font-semibold">[Nombre]</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navigation.map((item) => (
            <div key={item.name}>
              {/* ITEM PRINCIPAL */}
              <div
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                  isActive(item.href)
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-700 hover:bg-gray-50"
                )}
                onClick={() => {
                  if (item.subItems) {
                    toggleExpand(item.name);
                  }
                }}
              >
                <Link
                  href={item.href}
                  className="flex flex-1 items-center gap-3"
                  onClick={(e) => {
                    if (item.subItems) {
                      e.preventDefault();
                    }
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto text-xs">{item.badge}</span>
                  )}
                </Link>

                {item.subItems && (
                  <div className="ml-2">
                    {expandedItems.includes(item.name) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                )}
              </div>

              {/* SUB-ITEMS */}
              {item.subItems && expandedItems.includes(item.name) && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-4">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        isSubItemActive(subItem.href)
                          ? "bg-emerald-50 text-emerald-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <subItem.icon className="h-4 w-4" />
                      <span>{subItem.name}</span>
                      {subItem.badge && (
                        <span className="ml-auto text-xs">{subItem.badge}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* FOOTER */}
      <div className="border-t p-4 space-y-2">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
          <Search className="h-5 w-5" />
          <span>Buscar</span>
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
          <Settings className="h-5 w-5" />
          <span>Configuración</span>
        </button>
      </div>
    </div>
  );
}