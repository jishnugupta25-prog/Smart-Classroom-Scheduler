import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Room, InsertRoom, insertRoomSchema } from "@shared/schema";
import { Redirect } from "wouter";
import { MapPin, Users, Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { useState } from "react";

export default function ManageRooms() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Redirect non-admin users
  if (user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const form = useForm<InsertRoom>({
    resolver: zodResolver(insertRoomSchema),
    defaultValues: {
      name: "",
      capacity: 0,
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: InsertRoom) => {
      const response = await apiRequest("POST", "/api/rooms", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Room Created",
        description: "New room has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      form.reset();
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertRoom }) => {
      const response = await apiRequest("PUT", `/api/rooms/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Room Updated",
        description: "Room has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      form.reset();
      setEditingRoom(null);
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      await apiRequest("DELETE", `/api/rooms/${roomId}`);
    },
    onSuccess: () => {
      toast({
        title: "Room Deleted",
        description: "Room has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertRoom) => {
    if (editingRoom) {
      updateRoomMutation.mutate({ id: editingRoom.id, data });
    } else {
      createRoomMutation.mutate(data);
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    form.reset({
      name: room.name,
      capacity: room.capacity,
    });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingRoom(null);
    form.reset({
      name: "",
      capacity: 0,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRoom(null);
    form.reset();
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Manage Rooms</h1>
            <p className="text-muted-foreground">Add, edit, and delete classroom spaces</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd} data-testid="button-add-room">
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-room-form">
              <DialogHeader>
                <DialogTitle>
                  {editingRoom ? "Edit Room" : "Add New Room"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-room">
                <div className="space-y-2">
                  <Label htmlFor="name">Room Name *</Label>
                  <Input
                    id="name"
                    data-testid="input-room-name"
                    placeholder="e.g., Room A101, Conference Room B"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    data-testid="input-room-capacity"
                    type="number"
                    placeholder="e.g., 30"
                    min="1"
                    max="500"
                    {...form.register("capacity", { valueAsNumber: true })}
                  />
                  {form.formState.errors.capacity && (
                    <p className="text-sm text-destructive">{form.formState.errors.capacity.message}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel-room"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createRoomMutation.isPending || updateRoomMutation.isPending}
                    data-testid="button-save-room"
                  >
                    {createRoomMutation.isPending || updateRoomMutation.isPending
                      ? "Saving..."
                      : editingRoom ? "Update Room" : "Create Room"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <main className="flex-1 p-6">
          <Card data-testid="card-rooms-list">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Rooms ({rooms.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8" data-testid="loading-rooms">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading rooms...</p>
                </div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-8" data-testid="no-rooms">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No rooms found. Add your first room to get started.</p>
                  <Button onClick={handleAdd} className="mt-4" data-testid="button-add-first-room">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Room
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room) => (
                    <Card key={room.id} className="hover:shadow-md transition-shadow" data-testid={`card-room-${room.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg" data-testid={`text-room-name-${room.id}`}>
                              {room.name}
                            </CardTitle>
                            <div className="flex items-center gap-1 text-muted-foreground mt-1">
                              <Users className="h-4 w-4" />
                              <span className="text-sm" data-testid={`text-room-capacity-${room.id}`}>
                                {room.capacity} people
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(room)}
                              data-testid={`button-edit-${room.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  data-testid={`button-delete-${room.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Room</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{room.name}"? This action cannot be undone
                                    and will cancel all associated bookings.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteRoomMutation.mutate(room.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    data-testid={`button-confirm-delete-${room.id}`}
                                  >
                                    Delete Room
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          Created: {new Date(room.createdAt).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
