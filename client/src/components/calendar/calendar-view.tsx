import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookingWithDetails, Room } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import { BookingModal } from "./booking-modal";
import { BookRoomModal } from "./book-room-modal";
import { useAuth } from "@/hooks/use-auth";

export function CalendarView() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookRoomModal, setShowBookRoomModal] = useState(false);
  
  // Filter states
  const [roomFilter, setRoomFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings", roomFilter, statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roomFilter && roomFilter !== "all") params.append("roomId", roomFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      
      const response = await fetch(`/api/bookings?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
    },
  });

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  // Calendar navigation
  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfCalendar = new Date(firstDayOfMonth);
    firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - firstDayOfMonth.getDay());
    
    const days = [];
    const currentCalendarDate = new Date(firstDayOfCalendar);
    
    for (let i = 0; i < 42; i++) {
      const dateStr = currentCalendarDate.toISOString().split('T')[0];
      const dayBookings = bookings.filter(booking => booking.date === dateStr);
      
      days.push({
        date: new Date(currentCalendarDate),
        dateStr,
        bookings: dayBookings,
        isCurrentMonth: currentCalendarDate.getMonth() === month,
        isToday: dateStr === new Date().toISOString().split('T')[0],
      });
      
      currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":");
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const handleBookingClick = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const clearFilters = () => {
    setRoomFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card data-testid="card-calendar-filters">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Room</Label>
              <Select value={roomFilter} onValueChange={setRoomFilter}>
                <SelectTrigger data-testid="select-room-filter">
                  <SelectValue placeholder="All Rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                data-testid="input-date-from"
              />
            </div>

            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                data-testid="input-date-to"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
              Clear Filters
            </Button>
            {user?.role === "faculty" && (
              <Button onClick={() => setShowBookRoomModal(true)} data-testid="button-open-book-room-modal">
                <Plus className="h-4 w-4 mr-2" />
                Book Room
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card data-testid="card-calendar-view">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")} data-testid="button-prev-month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold" data-testid="text-current-month">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")} data-testid="button-next-month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={view === "month" ? "default" : "outline"} 
                size="sm"
                onClick={() => setView("month")}
                data-testid="button-month-view"
              >
                Month
              </Button>
              <Button 
                variant={view === "week" ? "default" : "outline"} 
                size="sm"
                onClick={() => setView("week")}
                data-testid="button-week-view"
              >
                Week
              </Button>
              <Button 
                variant={view === "day" ? "default" : "outline"} 
                size="sm"
                onClick={() => setView("day")}
                data-testid="button-day-view"
              >
                Day
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {bookingsLoading ? (
            <div className="text-center py-8" data-testid="loading-calendar">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading calendar...</p>
            </div>
          ) : (
            <>
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[100px] border p-2 ${
                      day.isCurrentMonth ? "bg-background" : "bg-muted/30"
                    } ${
                      day.isToday ? "bg-accent" : ""
                    }`}
                    data-testid={`calendar-day-${day.dateStr}`}
                  >
                    <div className={`text-sm mb-1 ${
                      day.isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                    } ${
                      day.isToday ? "font-bold" : ""
                    }`}>
                      {day.date.getDate()}
                    </div>
                    
                    {/* Bookings for this day */}
                    <div className="space-y-1">
                      {day.bookings.slice(0, 3).map((booking) => (
                        <div
                          key={booking.id}
                          className={`text-xs p-1 rounded cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(booking.status)} text-white`}
                          onClick={() => handleBookingClick(booking)}
                          data-testid={`booking-event-${booking.id}`}
                        >
                          <div className="truncate font-medium">{booking.courseName}</div>
                          <div className="truncate opacity-90">{booking.room.name}</div>
                        </div>
                      ))}
                      {day.bookings.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{day.bookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card data-testid="card-booking-legend">
        <CardHeader>
          <CardTitle>Booking Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Cancelled</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <BookingModal
        booking={selectedBooking}
        open={showBookingModal}
        onOpenChange={setShowBookingModal}
      />
      
      <BookRoomModal
        open={showBookRoomModal}
        onOpenChange={setShowBookRoomModal}
      />
    </div>
  );
}
