import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingSchema, type InsertBooking, type Room } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";
import { Calendar, Clock, Users, AlertCircle } from "lucide-react";

const bookingFormSchema = insertBookingSchema.omit({ facultyId: true });

export default function BookRoom() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect non-faculty users
  if (user?.role !== "faculty") {
    return <Redirect to="/" />;
  }

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const form = useForm<Omit<InsertBooking, "facultyId">>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      courseName: "",
      roomId: "",
      date: "",
      startTime: "",
      endTime: "",
      expectedAttendance: undefined,
      specialRequirements: "",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: Omit<InsertBooking, "facultyId">) => {
      const response = await apiRequest("POST", "/api/bookings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Request Submitted",
        description: "Your booking request has been submitted and is pending approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertBooking, "facultyId">) => {
    createBookingMutation.mutate(data);
  };

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const formatTimeSlot = (time: string) => {
    const [hour] = time.split(":");
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:00 ${ampm}`;
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b border-border px-6 py-4">
          <h1 className="text-2xl font-semibold">Book a Classroom</h1>
          <p className="text-muted-foreground">Request a room for your class or meeting</p>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <Card data-testid="card-book-room">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-book-room">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="courseName">Course Name *</Label>
                      <Input
                        id="courseName"
                        data-testid="input-course-name"
                        placeholder="e.g., CS101 - Programming Basics"
                        {...form.register("courseName")}
                      />
                      {form.formState.errors.courseName && (
                        <p className="text-sm text-destructive">{form.formState.errors.courseName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="roomId">Room *</Label>
                      <Select onValueChange={(value) => form.setValue("roomId", value)}>
                        <SelectTrigger data-testid="select-room">
                          <SelectValue placeholder="Select a room" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name} (Capacity: {room.capacity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.roomId && (
                        <p className="text-sm text-destructive">{form.formState.errors.roomId.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        data-testid="input-date"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        {...form.register("date")}
                      />
                      {form.formState.errors.date && (
                        <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expectedAttendance">Expected Attendance</Label>
                      <Input
                        id="expectedAttendance"
                        data-testid="input-expected-attendance"
                        type="number"
                        placeholder="e.g., 25"
                        min="1"
                        max="200"
                        {...form.register("expectedAttendance", { valueAsNumber: true })}
                      />
                      {form.formState.errors.expectedAttendance && (
                        <p className="text-sm text-destructive">{form.formState.errors.expectedAttendance.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Select onValueChange={(value) => form.setValue("startTime", value)}>
                        <SelectTrigger data-testid="select-start-time">
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {formatTimeSlot(time)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.startTime && (
                        <p className="text-sm text-destructive">{form.formState.errors.startTime.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time *</Label>
                      <Select onValueChange={(value) => form.setValue("endTime", value)}>
                        <SelectTrigger data-testid="select-end-time">
                          <SelectValue placeholder="Select end time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.slice(1).map((time) => (
                            <SelectItem key={time} value={time}>
                              {formatTimeSlot(time)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.endTime && (
                        <p className="text-sm text-destructive">{form.formState.errors.endTime.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialRequirements">Special Requirements (Optional)</Label>
                    <Textarea
                      id="specialRequirements"
                      data-testid="textarea-special-requirements"
                      placeholder="e.g., Need projector, whiteboard, lab equipment..."
                      {...form.register("specialRequirements")}
                    />
                    {form.formState.errors.specialRequirements && (
                      <p className="text-sm text-destructive">{form.formState.errors.specialRequirements.message}</p>
                    )}
                  </div>

                  <Card className="bg-muted/50" data-testid="card-booking-summary">
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Booking Summary
                      </h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>• Room availability will be checked automatically</div>
                        <div>• Booking requests require admin approval</div>
                        <div>• You'll receive confirmation once approved</div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => form.reset()}
                      data-testid="button-clear-form"
                    >
                      Clear Form
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={createBookingMutation.isPending}
                      data-testid="button-submit-booking"
                    >
                      {createBookingMutation.isPending ? "Submitting..." : "Submit Booking Request"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
