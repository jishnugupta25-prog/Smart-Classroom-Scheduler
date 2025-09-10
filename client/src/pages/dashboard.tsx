import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, MapPin, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BookingWithDetails, Room } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: bookings = [] } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const stats = {
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter(b => b.status === "confirmed").length,
    pendingBookings: bookings.filter(b => b.status === "pending").length,
    cancelledBookings: bookings.filter(b => b.status === "cancelled").length,
  };

  const recentBookings = bookings
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b border-border px-6 py-4">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card data-testid="card-total-bookings">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-bookings">{stats.totalBookings}</div>
                {user?.role === "faculty" && (
                  <p className="text-xs text-muted-foreground">Your bookings</p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-confirmed-bookings">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-confirmed-bookings">
                  {stats.confirmedBookings}
                </div>
                <p className="text-xs text-muted-foreground">Ready to go</p>
              </CardContent>
            </Card>

            <Card data-testid="card-pending-bookings">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-bookings">
                  {stats.pendingBookings}
                </div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card data-testid="card-cancelled-bookings">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600" data-testid="text-cancelled-bookings">
                  {stats.cancelledBookings}
                </div>
                <p className="text-xs text-muted-foreground">Not available</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Bookings */}
          <Card data-testid="card-recent-bookings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8" data-testid="text-no-bookings">
                  No bookings found. {user?.role === "faculty" && "Start by booking a room!"}
                </p>
              ) : (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                      data-testid={`booking-${booking.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          booking.status === "confirmed" ? "bg-green-500" :
                          booking.status === "pending" ? "bg-yellow-500" :
                          "bg-red-500"
                        }`} />
                        <div>
                          <p className="font-medium" data-testid={`text-course-${booking.id}`}>
                            {booking.courseName}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {booking.room.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {booking.faculty.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p data-testid={`text-date-${booking.id}`}>{booking.date}</p>
                        <p className="text-muted-foreground" data-testid={`text-time-${booking.id}`}>
                          {booking.startTime} - {booking.endTime}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {user?.role === "faculty" && (
              <Card data-testid="card-quick-actions">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href="/book-room"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    data-testid="link-book-room"
                  >
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Book a Room</span>
                  </a>
                  <a
                    href="/my-bookings"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    data-testid="link-my-bookings"
                  >
                    <Clock className="h-5 w-5 text-primary" />
                    <span>View My Bookings</span>
                  </a>
                </CardContent>
              </Card>
            )}

            <Card data-testid="card-room-overview">
              <CardHeader>
                <CardTitle>Room Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Rooms</span>
                    <span className="font-medium" data-testid="text-total-rooms">{rooms.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available Today</span>
                    <span className="font-medium text-green-600" data-testid="text-available-rooms">
                      {rooms.length - bookings.filter(b => 
                        b.date === new Date().toISOString().split('T')[0] && 
                        b.status === "confirmed"
                      ).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
