import { visitors, vehicles, activityLogs, users, type Visitor, type Vehicle, type ActivityLog, type User, type InsertVisitor, type InsertVehicle, type InsertActivityLog, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;
  deactivateUser(id: number): Promise<void>;

  // Visitor operations
  createVisitor(visitor: InsertVisitor, userId?: number): Promise<Visitor>;
  getVisitor(id: number): Promise<Visitor | undefined>;
  getVisitorsInside(): Promise<Visitor[]>;
  markVisitorExit(id: number, userId?: number): Promise<Visitor>;
  getAllVisitors(): Promise<Visitor[]>;
  getVisitorsByDateRange(startDate: Date, endDate: Date): Promise<Visitor[]>;

  // Vehicle operations
  createVehicle(vehicle: InsertVehicle, userId?: number): Promise<Vehicle>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehiclesInside(): Promise<Vehicle[]>;
  markVehicleExit(id: number, userId?: number): Promise<Vehicle>;
  getAllVehicles(): Promise<Vehicle[]>;
  getVehiclesByDateRange(startDate: Date, endDate: Date): Promise<Vehicle[]>;

  // Activity logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(): Promise<ActivityLog[]>;
  getActivityLogsByDateRange(startDate: Date, endDate: Date): Promise<ActivityLog[]>;

  // Stats
  getStats(): Promise<{ visitorsInside: number; vehiclesInside: number }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true)).orderBy(desc(users.createdAt));
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deactivateUser(id: number): Promise<void> {
    await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async createVisitor(insertVisitor: InsertVisitor, userId?: number): Promise<Visitor> {
    const [visitor] = await db
      .insert(visitors)
      .values(insertVisitor)
      .returning();
    
    // Create activity log
    await this.createActivityLog({
      type: "visitor",
      entityId: visitor.id,
      entityName: visitor.name,
      action: "ENTRY",
      createdBy: userId,
    });
    
    return visitor;
  }

  async getVisitor(id: number): Promise<Visitor | undefined> {
    const [visitor] = await db.select().from(visitors).where(eq(visitors.id, id));
    return visitor || undefined;
  }

  async getVisitorsInside(): Promise<Visitor[]> {
    return await db.select().from(visitors).where(eq(visitors.status, "IN"));
  }

  async markVisitorExit(id: number, userId?: number): Promise<Visitor> {
    const [visitor] = await db
      .update(visitors)
      .set({ status: "OUT", exitTime: new Date() })
      .where(eq(visitors.id, id))
      .returning();

    // Create activity log
    await this.createActivityLog({
      type: "visitor",
      entityId: visitor.id,
      entityName: visitor.name,
      action: "EXIT",
      createdBy: userId,
    });

    return visitor;
  }

  async getAllVisitors(): Promise<Visitor[]> {
    return await db.select().from(visitors).orderBy(desc(visitors.entryTime));
  }

  async getVisitorsByDateRange(startDate: Date, endDate: Date): Promise<Visitor[]> {
    return await db
      .select()
      .from(visitors)
      .where(
        and(
          gte(visitors.entryTime, startDate),
          lte(visitors.entryTime, endDate)
        )
      )
      .orderBy(desc(visitors.entryTime));
  }

  async createVehicle(insertVehicle: InsertVehicle, userId?: number): Promise<Vehicle> {
    const [vehicle] = await db
      .insert(vehicles)
      .values(insertVehicle)
      .returning();
    
    // Create activity log
    await this.createActivityLog({
      type: "vehicle",
      entityId: vehicle.id,
      entityName: vehicle.plateNumber,
      action: "ENTRY",
      createdBy: userId,
    });
    
    return vehicle;
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async getVehiclesInside(): Promise<Vehicle[]> {
    return await db.select().from(vehicles).where(eq(vehicles.status, "IN"));
  }

  async markVehicleExit(id: number, userId?: number): Promise<Vehicle> {
    const [vehicle] = await db
      .update(vehicles)
      .set({ status: "OUT", exitTime: new Date() })
      .where(eq(vehicles.id, id))
      .returning();

    // Create activity log
    await this.createActivityLog({
      type: "vehicle",
      entityId: vehicle.id,
      entityName: vehicle.plateNumber,
      action: "EXIT",
      createdBy: userId,
    });

    return vehicle;
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles).orderBy(desc(vehicles.entryTime));
  }

  async getVehiclesByDateRange(startDate: Date, endDate: Date): Promise<Vehicle[]> {
    return await db
      .select()
      .from(vehicles)
      .where(
        and(
          gte(vehicles.entryTime, startDate),
          lte(vehicles.entryTime, endDate)
        )
      )
      .orderBy(desc(vehicles.entryTime));
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db
      .insert(activityLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp));
  }

  async getActivityLogsByDateRange(startDate: Date, endDate: Date): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(
        and(
          gte(activityLogs.timestamp, startDate),
          lte(activityLogs.timestamp, endDate)
        )
      )
      .orderBy(desc(activityLogs.timestamp));
  }

  async getStats(): Promise<{ visitorsInside: number; vehiclesInside: number }> {
    const visitorsInside = await db.select().from(visitors).where(eq(visitors.status, "IN"));
    const vehiclesInside = await db.select().from(vehicles).where(eq(vehicles.status, "IN"));
    
    return {
      visitorsInside: visitorsInside.length,
      vehiclesInside: vehiclesInside.length,
    };
  }
}

export const storage = new DatabaseStorage();
