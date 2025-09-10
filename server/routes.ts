import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertRoomSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Rooms endpoints
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.post("/api/rooms", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      res.status(201).json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid room data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.put("/api/rooms/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const roomData = insertRoomSchema.partial().parse(req.body);
      const room = await storage.updateRoom(req.params.id, roomData);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid room data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update room" });
    }
  });

  app.delete("/api/rooms/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const deleted = await storage.deleteRoom(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete room" });
    }
  });

  // Bookings endpoints
  app.get("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { roomId, status, dateFrom, dateTo } = req.query;
      let facultyId = req.query.facultyId as string;
      
      // Students and faculty can only see their own bookings unless they're admin
      if (req.user?.role === "faculty" && !facultyId) {
        facultyId = req.user.id;
      } else if (req.user?.role === "student") {
        // Students can view all bookings (read-only)
        facultyId = undefined;
      } else if (req.user?.role !== "admin" && facultyId && facultyId !== req.user.id) {
        return res.status(403).json({ message: "Cannot access other users' bookings" });
      }

      const bookings = await storage.getBookings({
        roomId: roomId as string,
        facultyId,
        status: status as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      });

      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check permissions
      if (req.user?.role !== "admin" && req.user?.role !== "student" && booking.facultyId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "faculty") {
      return res.status(403).json({ message: "Faculty access required" });
    }

    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        facultyId: req.user.id, // Ensure faculty can only create bookings for themselves
      });

      // Check for conflicting bookings
      const existingBookings = await storage.getBookings({
        roomId: bookingData.roomId,
        dateFrom: bookingData.date,
        dateTo: bookingData.date,
      });

      const hasConflict = existingBookings.some(existing => {
        if (existing.status === "cancelled") return false;
        
        const existingStart = existing.startTime;
        const existingEnd = existing.endTime;
        const newStart = bookingData.startTime;
        const newEnd = bookingData.endTime;
        
        return (
          (newStart >= existingStart && newStart < existingEnd) ||
          (newEnd > existingStart && newEnd <= existingEnd) ||
          (newStart <= existingStart && newEnd >= existingEnd)
        );
      });

      if (hasConflict) {
        return res.status(409).json({ message: "Room is already booked for the selected time slot" });
      }

      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.put("/api/bookings/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check permissions - faculty can edit their own, admin can edit any
      if (req.user?.role !== "admin" && booking.facultyId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData = insertBookingSchema.partial().parse(req.body);
      // Don't allow faculty to change facultyId
      if (req.user?.role !== "admin") {
        delete updateData.facultyId;
      }

      const updatedBooking = await storage.updateBooking(req.params.id, updateData);
      res.json(updatedBooking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete("/api/bookings/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check permissions - faculty can cancel their own, admin can cancel any
      if (req.user?.role !== "admin" && booking.facultyId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Instead of deleting, mark as cancelled
      await storage.updateBooking(req.params.id, { status: "cancelled" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
