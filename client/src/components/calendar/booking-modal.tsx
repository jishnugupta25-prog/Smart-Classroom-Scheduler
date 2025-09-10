import { BookingWithDetails } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, Users, User, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BookingModalProps {
  booking: BookingWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingModal({ booking, open, onOpenChange }: BookingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await apiRequest("DELETE", `/api/bookings/${bookingId}`);
    },
    onSuccess: () => {
      toast({
        title: "Booking Cancelled",
        description: "The booking has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!booking) return null;

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case "pending":
        return <AlertCircle className="h-3 w-3 mr-1" />;
      case "cancelled":
        return <XCircle className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":");
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const canCancelBooking = () => {
    if (booking.status === "cancelled") return false;
    
    // Admin can cancel any booking
    if (user?.role === "admin") return true;
    
    // Faculty can cancel their own bookings
    if (user?.role === "faculty" && booking.facultyId === user.id) return true;
    
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="modal-booking-details">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Course</span>
            <span className="font-medium" data-testid="text-modal-course">{booking.courseName}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Faculty</span>
            <span className="font-medium" data-testid="text-modal-faculty">{booking.faculty.name}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Room</span>
            <span className="font-medium" data-testid="text-modal-room">{booking.room.name}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium" data-testid="text-modal-date">{formatDate(booking.date)}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Time</span>
            <span className="font-medium" data-testid="text-modal-time">
              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Status</span>
            <Badge className={getStatusColor(booking.status)} data-testid="badge-modal-status">
              {getStatusIcon(booking.status)}
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
          </div>
          
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Capacity</span>
            <span className="font-medium" data-testid="text-modal-capacity">{booking.room.capacity} people</span>
          </div>

          {booking.expectedAttendance && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Expected Attendance</span>
              <span className="font-medium" data-testid="text-modal-attendance">{booking.expectedAttendance} people</span>
            </div>
          )}

          {booking.specialRequirements && (
            <div className="py-2">
              <span className="text-muted-foreground block mb-1">Special Requirements</span>
              <span className="text-sm" data-testid="text-modal-requirements">{booking.specialRequirements}</span>
            </div>
          )}
        </div>

        {canCancelBooking() && (
          <div className="flex gap-3 mt-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  data-testid="button-modal-cancel-booking"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Booking
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this booking for "{booking.courseName}"? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancelBookingMutation.mutate(booking.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="button-confirm-modal-cancel"
                  >
                    Cancel Booking
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
