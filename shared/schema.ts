import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const visitors = pgTable("visitors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  idNumber: text("id_number").notNull(),
  city: text("city"),
  address: text("address"),
  company: text("company"),
  phone: text("phone"),
  idImageUrl: text("id_image_url"),
  status: text("status").notNull().default("IN"), // IN or OUT
  entryTime: timestamp("entry_time").notNull().defaultNow(),
  exitTime: timestamp("exit_time"),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  plateNumber: text("plate_number").notNull(),
  ownerName: text("owner_name").notNull(),
  type: text("type"), // car, motorcycle, truck, van, other
  color: text("color"),
  phone: text("phone"),
  status: text("status").notNull().default("IN"), // IN or OUT
  entryTime: timestamp("entry_time").notNull().defaultNow(),
  exitTime: timestamp("exit_time"),
});

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"), // admin or user
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // visitor or vehicle
  entityId: integer("entity_id").notNull(),
  entityName: text("entity_name").notNull(),
  action: text("action").notNull(), // ENTRY or EXIT
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

export const userRelations = relations(users, ({ many, one }) => ({
  createdUsers: many(users, { relationName: "createdBy" }),
  createdBy: one(users, { 
    fields: [users.createdBy], 
    references: [users.id],
    relationName: "createdBy"
  }),
  activityLogs: many(activityLogs),
}));

export const visitorRelations = relations(visitors, ({ many }) => ({
  logs: many(activityLogs),
}));

export const vehicleRelations = relations(vehicles, ({ many }) => ({
  logs: many(activityLogs),
}));

export const activityLogRelations = relations(activityLogs, ({ one }) => ({
  createdBy: one(users, {
    fields: [activityLogs.createdBy],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVisitorSchema = createInsertSchema(visitors).omit({
  id: true,
  entryTime: true,
  exitTime: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  entryTime: true,
  exitTime: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type Visitor = typeof visitors.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
