import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVisitorSchema, insertVehicleSchema, insertUserSchema, loginSchema } from "@shared/schema";
import { setupAuth, requireAuth, requireAdmin, hashPassword, verifyPassword } from "./auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware
  setupAuth(app);

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      req.session.fullName = user.fullName;
      
      res.json({ 
        id: user.id, 
        username: user.username, 
        fullName: user.fullName, 
        role: user.role 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid'); // Default session cookie name
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "User not found" });
      }
      res.json({ 
        id: user.id, 
        username: user.username, 
        fullName: user.fullName, 
        role: user.role 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  // Admin routes for user management
  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const hashedPassword = await hashPassword(userData.password);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        createdBy: req.session.userId,
      });
      
      res.json({ 
        id: user.id, 
        username: user.username, 
        fullName: user.fullName, 
        role: user.role 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get dashboard stats
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Visitor routes
  app.post("/api/visitors", requireAuth, async (req, res) => {
    try {
      const visitorData = insertVisitorSchema.parse(req.body);
      const visitor = await storage.createVisitor(visitorData, req.session.userId);
      res.json(visitor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid visitor data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create visitor" });
      }
    }
  });

  app.get("/api/visitors", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (startDate && endDate) {
        const visitors = await storage.getVisitorsByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
        res.json(visitors);
      } else {
        const visitors = await storage.getAllVisitors();
        res.json(visitors);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch visitors" });
    }
  });

  app.get("/api/visitors/inside", requireAuth, async (req, res) => {
    try {
      const visitors = await storage.getVisitorsInside();
      res.json(visitors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch visitors inside" });
    }
  });

  app.post("/api/visitors/:id/exit", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid visitor ID" });
      }
      const visitor = await storage.markVisitorExit(id, req.session.userId);
      res.json(visitor);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark visitor exit" });
    }
  });

  // Vehicle routes
  app.post("/api/vehicles", requireAuth, async (req, res) => {
    try {
      const vehicleData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(vehicleData, req.session.userId);
      res.json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create vehicle" });
      }
    }
  });

  app.get("/api/vehicles", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (startDate && endDate) {
        const vehicles = await storage.getVehiclesByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
        res.json(vehicles);
      } else {
        const vehicles = await storage.getAllVehicles();
        res.json(vehicles);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/inside", requireAuth, async (req, res) => {
    try {
      const vehicles = await storage.getVehiclesInside();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicles inside" });
    }
  });

  app.post("/api/vehicles/:id/exit", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vehicle ID" });
      }
      const vehicle = await storage.markVehicleExit(id, req.session.userId);
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark vehicle exit" });
    }
  });

  // Activity logs - Admin only access for comprehensive logs
  app.get("/api/logs", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (startDate && endDate) {
        const logs = await storage.getActivityLogsByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
        res.json(logs);
      } else {
        const logs = await storage.getActivityLogs();
        res.json(logs);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
