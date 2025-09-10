import { type User, type InsertUser, type Room, type InsertRoom, type Booking, type InsertBooking, type BookingWithDetails } from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getRooms(): Promise<Room[]>;
  getRoom(id: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, room: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: string): Promise<boolean>;
  
  getBookings(filters?: { roomId?: string; facultyId?: string; status?: string; dateFrom?: string; dateTo?: string }): Promise<BookingWithDetails[]>;
  getBooking(id: string): Promise<BookingWithDetails | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: string): Promise<boolean>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private rooms: Map<string, Room>;
  private bookings: Map<string, Booking>;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.bookings = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with some default rooms
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const defaultRooms = [
      { name: "Room A101", capacity: 30 },
      { name: "Room B205", capacity: 25 },
      { name: "Lab C301", capacity: 20 },
      { name: "Conference Room D401", capacity: 15 },
      { name: "Auditorium E501", capacity: 100 }
    ];

    defaultRooms.forEach(room => {
      const id = randomUUID();
      const roomData: Room = {
        id,
        ...room,
        createdAt: new Date(),
      };
      this.rooms.set(id, roomData);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      ...insertUser,
      role: insertUser.role || "student",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = randomUUID();
    const room: Room = {
      id,
      ...insertRoom,
      createdAt: new Date(),
    };
    this.rooms.set(id, room);
    return room;
  }

  async updateRoom(id: string, roomUpdate: Partial<InsertRoom>): Promise<Room | undefined> {
    const existing = this.rooms.get(id);
    if (!existing) return undefined;
    
    const updated: Room = { ...existing, ...roomUpdate };
    this.rooms.set(id, updated);
    return updated;
  }

  async deleteRoom(id: string): Promise<boolean> {
    return this.rooms.delete(id);
  }

  async getBookings(filters?: { roomId?: string; facultyId?: string; status?: string; dateFrom?: string; dateTo?: string }): Promise<BookingWithDetails[]> {
    let bookings = Array.from(this.bookings.values());
    
    if (filters) {
      if (filters.roomId) {
        bookings = bookings.filter(b => b.roomId === filters.roomId);
      }
      if (filters.facultyId) {
        bookings = bookings.filter(b => b.facultyId === filters.facultyId);
      }
      if (filters.status) {
        bookings = bookings.filter(b => b.status === filters.status);
      }
      if (filters.dateFrom) {
        bookings = bookings.filter(b => b.date >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        bookings = bookings.filter(b => b.date <= filters.dateTo!);
      }
    }
    
    // Join with room and faculty data
    const bookingsWithDetails: BookingWithDetails[] = [];
    for (const booking of bookings) {
      const room = this.rooms.get(booking.roomId);
      const faculty = this.users.get(booking.facultyId);
      
      if (room && faculty) {
        bookingsWithDetails.push({
          ...booking,
          room,
          faculty: {
            id: faculty.id,
            name: faculty.name,
            email: faculty.email,
          },
        });
      }
    }
    
    return bookingsWithDetails.sort((a, b) => 
      new Date(a.date + ' ' + a.startTime).getTime() - new Date(b.date + ' ' + b.startTime).getTime()
    );
  }

  async getBooking(id: string): Promise<BookingWithDetails | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const room = this.rooms.get(booking.roomId);
    const faculty = this.users.get(booking.facultyId);
    
    if (!room || !faculty) return undefined;
    
    return {
      ...booking,
      room,
      faculty: {
        id: faculty.id,
        name: faculty.name,
        email: faculty.email,
      },
    };
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = {
      id,
      ...insertBooking,
      status: insertBooking.status || "pending",
      expectedAttendance: insertBooking.expectedAttendance ?? null,
      specialRequirements: insertBooking.specialRequirements ?? null,
      createdAt: new Date(),
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: string, bookingUpdate: Partial<InsertBooking>): Promise<Booking | undefined> {
    const existing = this.bookings.get(id);
    if (!existing) return undefined;
    
    const updated: Booking = { ...existing, ...bookingUpdate };
    this.bookings.set(id, updated);
    return updated;
  }

  async deleteBooking(id: string): Promise<boolean> {
    return this.bookings.delete(id);
  }
}

export const storage = new MemStorage();
