
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Phone, Edit, Mail, AlertCircle } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, isToday } from "date-fns";
import { fr } from "date-fns/locale";

interface RendezVous {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  type_assurance: string;
  statut: string;
  date_creation: string;
  date_contact?: string;
  priorite: string;
}

interface CalendarViewProps {
  rendezVous: RendezVous[];
  onEditRdv: (rdv: RendezVous) => void;
  onContactClient: (rdv: RendezVous) => void;
  onCallClient: (rdv: RendezVous) => void;
}

export const CalendarView = ({ rendezVous, onEditRdv, onContactClient, onCallClient }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getRdvForDate = (date: Date) => {
    return rendezVous.filter(rdv => {
      const rdvDate = new Date(rdv.date_contact || rdv.date_creation);
      return isSameDay(rdvDate, date);
    });
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "nouveau":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "en cours":
        return "bg-green-100 text-green-800 border-green-200";
      case "termine":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "annule":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPrioriteIcon = (priorite: string) => {
    if (priorite === 'haute') {
      return <AlertCircle className="w-3 h-3 text-red-500" />;
    }
    return null;
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: fr });
  };

  const formatTimeSlot = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  if (viewType === 'month') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subWeeks(currentDate, 4))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addWeeks(currentDate, 4))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => setViewType('week')}
          >
            Vue semaine
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentDate}
              onMonthChange={setCurrentDate}
              locale={fr}
              className="w-full"
              components={{
                Day: ({ date, ...props }) => {
                  const dayRdv = getRdvForDate(date);
                  const hasRdv = dayRdv.length > 0;
                  
                  return (
                    <div className="relative">
                      <button {...props} className={`
                        w-full h-10 flex items-center justify-center text-sm
                        ${hasRdv ? 'bg-blue-50 border border-blue-200 rounded' : ''}
                        ${isToday(date) ? 'bg-primary text-primary-foreground rounded' : ''}
                      `}>
                        {format(date, 'd')}
                        {hasRdv && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </button>
                    </div>
                  );
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            Semaine du {format(weekStart, 'dd MMM', { locale: fr })} au {format(weekEnd, 'dd MMM yyyy', { locale: fr })}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setViewType('month')}
          >
            Vue mois
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
          >
            Aujourd'hui
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-8 border-b">
            <div className="p-3 border-r bg-gray-50 text-sm font-medium">Heure</div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-3 border-r text-center ${
                  isToday(day) ? 'bg-blue-50 text-blue-700 font-semibold' : 'bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium">
                  {format(day, 'EEE', { locale: fr })}
                </div>
                <div className="text-lg">
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b min-h-16">
                <div className="p-2 border-r bg-gray-50 text-xs text-gray-600 flex items-start">
                  {formatTimeSlot(hour)}
                </div>
                {weekDays.map((day) => {
                  const dayRdv = getRdvForDate(day).filter(rdv => {
                    const rdvHour = new Date(rdv.date_contact || rdv.date_creation).getHours();
                    return rdvHour === hour;
                  });

                  return (
                    <div key={`${day.toISOString()}-${hour}`} className="p-1 border-r min-h-16">
                      {dayRdv.map((rdv) => (
                        <div
                          key={rdv.id}
                          className={`
                            p-2 mb-1 rounded text-xs border cursor-pointer
                            hover:shadow-md transition-shadow
                            ${getStatutColor(rdv.statut)}
                          `}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium truncate">
                              {rdv.nom} {rdv.prenom}
                            </span>
                            {getPrioriteIcon(rdv.priorite)}
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            {formatTime(rdv.date_contact || rdv.date_creation)}
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            {rdv.type_assurance}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCallClient(rdv);
                              }}
                            >
                              <Phone className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditRdv(rdv);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                onContactClient(rdv);
                              }}
                            >
                              <Mail className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
