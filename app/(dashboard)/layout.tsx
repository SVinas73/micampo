"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  DollarSign,
  Sprout,
  BookOpen,
  Beef,
  Truck,
  TrendingUp,
  Package,
  CloudSun,
  Apple,
  Receipt,
  Calculator,
  FileText,
  Activity,
  Sparkles,
  Calendar,
  Droplets,
  Shield,
  Map,
  Bug,
  Leaf,
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight,
  MapPin,
  CloudRain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Items del menú con sub-items para Agronomía
const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: DollarSign, label: "Finanzas", href: "/finanzas" },
  { 
    icon: Sprout, 
    label: "Agronomía", 
    href: "/agronomia",
    subItems: [
      { icon: Leaf, label: "Campo Digital", href: "/agronomia?tab=resumen" },
      { icon: MapPin, label: "Gestión de Lotes", href: "/agronomia?tab=lotes" },
      { icon: CloudRain, label: "Clima", href: "/clima" },
      { icon: Droplets, label: "Calculadora de Dosis", href: "/herramientas-agricolas?tab=calculadora" },
      { icon: Droplets, label: "Plan de Riego", href: "/agronomia/plan-riego", badge: "🔒" },
    ]
  },
  { icon: BookOpen, label: "Cuaderno de Campo", href: "/cuaderno-campo" },
  { icon: Beef, label: "Ganadería", href: "/ganaderia" },
  { icon: Truck, label: "Maquinaria", href: "/maquinaria" },
  { icon: TrendingUp, label: "Comercialización", href: "/comercializacion" },
  { icon: Package, label: "Inventario", href: "/inventario" },
  { icon: CloudSun, label: "Clima", href: "/clima" },
  { icon: Apple, label: "Nutrición", href: "/nutricion" },
  { icon: Receipt, label: "Conciliación Bancaria", href: "/conciliacion-bancaria" },
  { icon: Calculator, label: "Costos", href: "/costos" },
  { icon: FileText, label: "Arrendamientos", href: "/arrendamientos" },
  { icon: Activity, label: "Márgenes en Vivo", href: "/margenes-vivo" },
  { icon: Sparkles, label: "Alertas IA", href: "/alertas-predictivas" },
  { icon: Calendar, label: "Planificación Siembras", href: "/planificacion-siembras" },
  { icon: Droplets, label: "Producción Lechera", href: "/produccion-lechera" },
  { icon: Shield, label: "Trazabilidad", href: "/trazabilidad" },
  { icon: Map, label: "Agricultura Precisión", href: "/agricultura-precision" },
  { icon: Calculator, label: "Herramientas Agrícolas", href: "/herramientas-agricolas" },
  { icon: Bug, label: "Plagas y Riego", href: "/plagas-riego" },
  { icon: Beef, label: "Ganadería Avanzada", href: "/ganaderia-avanzada" },
  { icon: TrendingUp, label: "Agricultura Avanzada", href: "/agricultura-avanzada" },
  { icon: Activity, label: "Ganadería Completa", href: "/ganaderia-completa" },
  { icon: Package, label: "Logística e Inventario", href: "/logistica-inventario" },
  { icon: Leaf, label: "Sostenibilidad", href: "/sostenibilidad" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Agronomía"]); // Agronomía expandido por defecto

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img
            src="/logo.jpg"
            alt="MiCampo"
            className="w-20 h-20 mx-auto mb-4 rounded-lg object-contain"
          />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userInitials = session.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const toggleExpand = (itemLabel: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemLabel)
        ? prev.filter((name) => name !== itemLabel)
        : [...prev, itemLabel]
    );
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // FIX: Función corregida para detectar sub-item activo
  const isSubItemActive = (subHref: string) => {
    // Extraer path y query params del href del sub-item
    const [subPath, subQuery] = subHref.split("?");
    
    // Si el pathname no coincide, no está activo
    if (!pathname.includes(subPath)) {
      return false;
    }
    
    // Si tiene query params, verificar que coincidan EXACTAMENTE
    if (subQuery) {
      const currentTab = searchParams.get("tab");
      const subTab = new URLSearchParams(subQuery).get("tab");
      
      // Solo está activo si el tab actual coincide con el tab del sub-item
      return currentTab === subTab;
    }
    
    // Si no tiene query params, verificar que el path coincida exactamente
    return pathname === subPath;
  };

  const renderNavItem = (item: any, isMobile = false) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems.includes(item.label);

    return (
      <div key={item.href}>
        {/* ITEM PRINCIPAL */}
        <div
          className={`
            group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md cursor-pointer
            ${active ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}
          `}
          onClick={() => {
            if (hasSubItems) {
              toggleExpand(item.label);
            } else {
              if (isMobile) setSidebarOpen(false);
            }
          }}
        >
          <Link
            href={item.href}
            className="flex flex-1 items-center"
            onClick={(e) => {
              if (hasSubItems) {
                e.preventDefault();
              }
            }}
          >
            <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${active ? "text-green-700" : "text-gray-500"}`} />
            {item.label}
          </Link>

          {hasSubItems && (
            <div className="ml-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
        </div>

        {/* SUB-ITEMS */}
        {hasSubItems && isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-4">
            {item.subItems.map((subItem: any) => {
              const SubIcon = subItem.icon;
              const subActive = isSubItemActive(subItem.href);

              return (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 text-sm rounded-md
                    ${subActive ? "bg-green-50 text-green-700 font-medium" : "text-gray-600 hover:bg-gray-50"}
                  `}
                  onClick={() => {
                    if (isMobile) setSidebarOpen(false);
                  }}
                >
                  <SubIcon className="h-4 w-4" />
                  <span>{subItem.label}</span>
                  {subItem.badge && <span className="ml-auto text-xs">{subItem.badge}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fondo Difuminado */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/campo-fondo.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(8px) brightness(0.9)',
          opacity: 0.2,
        }}
      />

      {/* Contenido Principal */}
      <div className="relative z-10">
        {/* Sidebar Desktop */}
        <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex flex-col items-center flex-shrink-0 px-4 mb-6">
              <img
                src="/logo.jpg"
                alt="MiCampo Logo"
                className="w-24 h-24 rounded-lg object-contain mb-2"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <span className="text-xl font-bold text-gray-900">MiCampo</span>
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-500">Bienvenido,</p>
                <p className="text-sm font-semibold text-gray-700">
                  {session.user?.name?.split(" ")[0]}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {menuItems.map((item) => renderNavItem(item, false))}
            </nav>

            {/* User Profile */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <Avatar>
                  <AvatarFallback className="bg-green-600 text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 flex-1">
                  <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  title="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5 text-gray-500" />
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex items-center">
              <img
                src="/logo.jpg"
                alt="MiCampo"
                className="w-10 h-10 rounded-lg object-contain"
              />
              <span className="ml-2 text-lg font-bold text-gray-900">MiCampo</span>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-green-600 text-white text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex flex-col items-center flex-shrink-0 px-4 mb-6">
                  <img
                    src="/logo.jpg"
                    alt="MiCampo"
                    className="w-20 h-20 rounded-lg object-contain mb-2"
                  />
                  <span className="text-xl font-bold text-gray-900">MiCampo</span>
                  <div className="mt-2 text-center">
                    <p className="text-xs text-gray-500">Bienvenido,</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {session.user?.name?.split(" ")[0]}
                    </p>
                  </div>
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  {menuItems.map((item) => renderNavItem(item, true))}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <div className="flex items-center w-full">
                  <Avatar>
                    <AvatarFallback className="bg-green-600 text-white">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 flex-1">
                    <p className="text-xs text-gray-500">{session.user?.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOut className="h-5 w-5 text-gray-500" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="md:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}