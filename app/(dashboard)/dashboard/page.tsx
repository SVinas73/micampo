"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();

  const stats = [
    {
      title: "Balance Total",
      value: "$0",
      description: "Sin transacciones aún",
      icon: DollarSign,
      trend: null,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Ingresos del Mes",
      value: "$0",
      description: "Mes actual",
      icon: TrendingUp,
      trend: null,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Gastos del Mes",
      value: "$0",
      description: "Mes actual",
      icon: TrendingDown,
      trend: null,
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "Transacciones",
      value: "0",
      description: "Total registradas",
      icon: Activity,
      trend: null,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {session?.user?.name?.split(" ")[0]}
        </h1>
        <p className="text-gray-600 mt-2">
          Este es tu centro de comando para gestionar tu campo
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <DollarSign className="h-5 w-5 mr-2" />
              Módulo Financiero
            </CardTitle>
            <CardDescription>
              Gestioná ingresos, gastos y analizá la rentabilidad de tu campo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a 
              href="/finanzas" 
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Ir a Finanzas →
            </a>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-500">
              <Activity className="h-5 w-5 mr-2" />
              Agricultura de Precisión
            </CardTitle>
            <CardDescription>
              Monitoreá tus lotes con imágenes satelitales y recomendaciones IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-400 font-medium flex items-center">
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded">
                Próximamente
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-500">
              <Activity className="h-5 w-5 mr-2" />
              Ganadería Inteligente
            </CardTitle>
            <CardDescription>
              Controlá tu rodeo, sanidad, reproducción y alimentación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-400 font-medium flex items-center">
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded">
                Próximamente
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900">🚀 Comenzá a usar MiCampo</CardTitle>
          <CardDescription className="text-green-700">
            Seguí estos pasos para configurar tu campo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              1
            </div>
            <div>
              <p className="font-medium text-green-900">Registrá tu primer campo</p>
              <p className="text-sm text-green-700">Define el nombre, ubicación y hectáreas de tu campo</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              2
            </div>
            <div>
              <p className="font-medium text-green-900">Cargá tus primeras transacciones</p>
              <p className="text-sm text-green-700">Ingresá ingresos y gastos para comenzar a ver tu balance</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              3
            </div>
            <div>
              <p className="font-medium text-green-900">Analizá tus resultados</p>
              <p className="text-sm text-green-700">Visualizá gráficos y reportes de tu gestión financiera</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}