import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";
import AdminMetricsCards from "./AdminMetricsCards";
import AdminActivityFeed from "./AdminActivityFeed";
import AdminSystemStatus from "./AdminSystemStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { RefreshCw, TrendingUp, TrendingDown, Euro, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { NotificationPermissionButton } from "@/components/NotificationPermissionButton";

const Dashboard = () => {
  const { data: demandes, refetch: refetchDemandes } = useQuery({
    queryKey: ['admin-demandes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demandes_assurance')
        .select('*')
        .order('date_creation', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: conseillers, refetch: refetchConseillers } = useQuery({
    queryKey: ['admin-conseillers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conseillers')
        .select('*')
        .order('nom', { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: rappels, refetch: refetchRappels } = useQuery({
    queryKey: ['admin-rappels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rappels_clients')
        .select('*')
        .order('date_rappel', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'demandes_assurance'
      }, (payload) => {
        console.log('Changement détecté dans demandes_assurance:', payload);
        refetchDemandes();
        toast.info('Données mises à jour en temps réel');
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conseillers'
      }, (payload) => {
        console.log('Changement détecté dans conseillers:', payload);
        refetchConseillers();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rappels_clients'
      }, (payload) => {
        console.log('Changement détecté dans rappels_clients:', payload);
        refetchRappels();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchDemandes, refetchConseillers, refetchRappels]);

  const getWeeklyData = () => {
    if (!demandes) return [];
    
    const today = new Date();
    const weekStart = startOfWeek(today, { locale: fr });
    const weekEnd = endOfWeek(today, { locale: fr });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return days.map(day => {
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const demandesJour = demandes.filter(d => {
        const dateCreation = new Date(d.date_creation);
        return dateCreation >= dayStart && dateCreation < dayEnd;
      }).length;
      
      const conversionsJour = demandes.filter(d => {
        const dateCreation = new Date(d.date_creation);
        return dateCreation >= dayStart && dateCreation < dayEnd && d.statut === 'termine';
      }).length;
      
      return {
        name: format(day, 'EEE', { locale: fr }),
        demandes: demandesJour,
        conversions: conversionsJour
      };
    });
  };

  const getMonthlyTrend = () => {
    if (!demandes) return [];
    
    const today = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push(subMonths(today, i));
    }
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const demandesMois = demandes.filter(d => {
        const dateCreation = new Date(d.date_creation);
        return dateCreation >= monthStart && dateCreation <= monthEnd;
      });
      
      const conversions = demandesMois.filter(d => d.statut === 'termine').length;
      const enCours = demandesMois.filter(d => d.statut === 'en_cours').length;
      const traites = demandesMois.filter(d => d.statut === 'traite').length;
      const revenusEstimes = conversions * 1200;
      const tauxConversion = demandesMois.length > 0 ? Math.round((conversions / demandesMois.length) * 100) : 0;
      
      return {
        mois: format(month, 'MMM yyyy', { locale: fr }),
        demandes: demandesMois.length,
        conversions,
        enCours,
        traites,
        revenus: revenusEstimes,
        tauxConversion
      };
    });
  };

  const getAssuranceTypes = () => {
    if (!demandes) return [];
    
    const types = demandes.reduce((acc, demande) => {
      const type = demande.type_assurance;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    
    return Object.entries(types).map(([type, count], index) => ({
      type,
      count,
      percentage: Math.round((count / demandes.length) * 100),
      color: colors[index % colors.length]
    }));
  };

  const weeklyData = getWeeklyData();
  const monthlyTrend = getMonthlyTrend();
  const assuranceTypes = getAssuranceTypes();

  const currentMonth = monthlyTrend[monthlyTrend.length - 1];
  const previousMonth = monthlyTrend[monthlyTrend.length - 2];
  const demandsTrend = currentMonth && previousMonth ? 
    ((currentMonth.demandes - previousMonth.demandes) / previousMonth.demandes) * 100 : 0;
  const revenueTrend = currentMonth && previousMonth ? 
    ((currentMonth.revenus - previousMonth.revenus) / previousMonth.revenus) * 100 : 0;

  return (
    <div className="w-full min-w-0 overflow-x-hidden">
      <div className="max-w-full space-y-6 px-4">
        {/* En-tête avec indicateur de mise à jour */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Tableau de Bord Admin</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Vue d'ensemble complète du système - Mise à jour automatique</p>
            <div className="mt-3">
              <NotificationPermissionButton 
                userType="admin"
                className=""
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
            <RefreshCw className="h-4 w-4 animate-spin opacity-50" />
            <span className="whitespace-nowrap">Temps réel activé</span>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="w-full">
          <AdminMetricsCards 
            demandes={demandes || []} 
            conseillers={conseillers || []} 
            rappels={rappels || []} 
          />
        </div>

        {/* Statut système et performance */}
        <div className="w-full">
          <AdminSystemStatus 
            demandes={demandes || []} 
            conseillers={conseillers || []} 
            rappels={rappels || []} 
          />
        </div>

        {/* Section Graphiques principaux */}
        <div className="w-full space-y-6">
          {/* Titre de section */}
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Analyses Graphiques</h2>
            <p className="text-gray-600 text-sm sm:text-base">Visualisations détaillées des performances et tendances</p>
          </div>

          {/* Graphiques en grid responsive avec contraintes strictes */}
          <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Évolution des demandes */}
            <div className="min-w-0 w-full">
              <Card className="shadow-lg border-2 hover:shadow-xl transition-all duration-300 h-full">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                        <span className="truncate">Évolution Hebdomadaire</span>
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs sm:text-sm">
                        Demandes et conversions de cette semaine
                      </CardDescription>
                    </div>
                    <div className="text-right text-xs sm:text-sm text-gray-500 flex-shrink-0">
                      <div className="font-medium">Cette semaine</div>
                      <div>{weeklyData.reduce((acc, day) => acc + day.demandes, 0)} demandes</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="w-full h-[250px] sm:h-[280px]">
                    <ChartContainer
                      config={{
                        demandes: { label: "Demandes", color: "#3b82f6" },
                        conversions: { label: "Conversions", color: "#10b981" },
                      }}
                      className="w-full h-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="name" 
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            width={35}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="demandes" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="conversions" fill="#10b981" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Répartition par type */}
            <div className="min-w-0 w-full">
              <Card className="shadow-lg border-2 hover:shadow-xl transition-all duration-300 h-full">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                        <span className="truncate">Répartition par Type</span>
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs sm:text-sm">
                        Distribution des types d'assurance
                      </CardDescription>
                    </div>
                    <div className="text-right text-xs sm:text-sm text-gray-500 flex-shrink-0">
                      <div className="font-medium">Total</div>
                      <div>{assuranceTypes.reduce((acc, type) => acc + type.count, 0)} demandes</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col lg:flex-row items-center gap-3 sm:gap-4 w-full">
                    <div className="w-full lg:w-1/2 h-[180px] sm:h-[200px]">
                      <ChartContainer
                        config={{
                          auto: { label: "Auto", color: "#3b82f6" },
                          habitation: { label: "Habitation", color: "#10b981" },
                          sante: { label: "Santé", color: "#f59e0b" },
                          moto: { label: "Moto", color: "#ef4444" },
                          emprunteur: { label: "Emprunteur", color: "#8b5cf6" },
                          voyage: { label: "Voyage", color: "#06b6d4" },
                        }}
                        className="w-full h-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={assuranceTypes}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="count"
                            >
                              {assuranceTypes.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                    <div className="w-full lg:w-1/2 space-y-1 sm:space-y-2 max-h-[180px] sm:max-h-[200px] overflow-y-auto">
                      <h4 className="font-medium text-gray-900 mb-2 text-xs sm:text-sm">Détails par type</h4>
                      {assuranceTypes.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-1.5 sm:p-2 bg-gray-50 rounded text-xs">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                            <div
                              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium truncate text-xs">{item.type}</span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="font-bold text-gray-900 text-xs">{item.count}</div>
                            <div className="text-xs text-gray-500">{item.percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Tendance mensuelle */}
        <div className="w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Tendances Mensuelles</h2>
              <p className="text-gray-600 text-sm sm:text-base">Analyse détaillée des performances sur 6 mois</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                {demandsTrend >= 0 ? (
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                )}
                <span className={`font-medium ${demandsTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(demandsTrend).toFixed(1)}% demandes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Euro className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                <span className={`font-medium ${revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(revenueTrend).toFixed(1)}% revenus
                </span>
              </div>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Graphique des demandes et conversions */}
            <div className="min-w-0 w-full">
              <Card className="shadow-lg h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Demandes et Conversions</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Évolution des demandes et des conversions réussies</CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="w-full h-[280px] sm:h-[300px]">
                    <ChartContainer
                      config={{
                        demandes: { label: "Demandes", color: "#3b82f6" },
                        conversions: { label: "Conversions", color: "#10b981" },
                        enCours: { label: "En cours", color: "#f59e0b" },
                        traites: { label: "Traités", color: "#8b5cf6" },
                      }}
                      className="w-full h-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyTrend} margin={{ top: 5, right: 5, left: 5, bottom: 40 }}>
                          <defs>
                            <linearGradient id="colorDemandes" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="mois" 
                            fontSize={9}
                            tickLine={false}
                            axisLine={false}
                            angle={-45}
                            textAnchor="end"
                            height={50}
                            interval={0}
                          />
                          <YAxis 
                            fontSize={9}
                            tickLine={false}
                            axisLine={false}
                            width={30}
                          />
                          <ChartTooltip 
                            content={<ChartTooltipContent />} 
                            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="demandes"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorDemandes)"
                          />
                          <Area
                            type="monotone"
                            dataKey="conversions"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorConversions)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Graphique des revenus et taux de conversion */}
            <div className="min-w-0 w-full">
              <Card className="shadow-lg h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Revenus et Performance</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Revenus estimés et taux de conversion mensuel</CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="w-full h-[280px] sm:h-[300px]">
                    <ChartContainer
                      config={{
                        revenus: { label: "Revenus (€)", color: "#f59e0b" },
                        tauxConversion: { label: "Taux conversion (%)", color: "#ef4444" },
                      }}
                      className="w-full h-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrend} margin={{ top: 5, right: 5, left: 5, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="mois" 
                            fontSize={9}
                            tickLine={false}
                            axisLine={false}
                            angle={-45}
                            textAnchor="end"
                            height={50}
                            interval={0}
                          />
                          <YAxis 
                            yAxisId="left" 
                            fontSize={9}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                            width={40}
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            fontSize={9}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}%`}
                            width={30}
                          />
                          <ChartTooltip 
                            content={<ChartTooltipContent />} 
                            cursor={{ stroke: '#d1d5db', strokeWidth: 1 }}
                          />
                          <Bar 
                            yAxisId="left"
                            dataKey="revenus" 
                            fill="#f59e0b"
                            radius={[2, 2, 0, 0]}
                            opacity={0.8}
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="tauxConversion" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5, fill: '#ef4444' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Métriques de résumé */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-blue-700 truncate">Total Demandes</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-900">
                      {monthlyTrend.reduce((acc, month) => acc + month.demandes, 0)}
                    </p>
                  </div>
                  <div className="text-blue-600 flex-shrink-0">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-green-700 truncate">Total Conversions</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-900">
                      {monthlyTrend.reduce((acc, month) => acc + month.conversions, 0)}
                    </p>
                  </div>
                  <div className="text-green-600 flex-shrink-0">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-yellow-700 truncate">Revenus Estimés</p>
                    <p className="text-lg sm:text-2xl font-bold text-yellow-900">
                      {(monthlyTrend.reduce((acc, month) => acc + month.revenus, 0) / 1000).toFixed(0)}k€
                    </p>
                  </div>
                  <div className="text-yellow-600 flex-shrink-0">
                    <Euro className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-purple-700 truncate">Taux Moyen</p>
                    <p className="text-lg sm:text-2xl font-bold text-purple-900">
                      {monthlyTrend.length > 0 ? 
                        (monthlyTrend.reduce((acc, month) => acc + month.tauxConversion, 0) / monthlyTrend.length).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <div className="text-purple-600 flex-shrink-0">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activité récente */}
        <div className="w-full">
          <AdminActivityFeed 
            demandes={demandes || []} 
            rappels={rappels || []} 
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
