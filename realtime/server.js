// realtime/server.js

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();

/**
 * Allowed frontend origins (comma-separated in env)
 * Example:
 *   CORS_ORIGINS=https://justamomentplease.com,http://localhost:5173
 */
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Express CORS (for REST endpoints like /health and /broadcast/*)
app.use(
  cors({
    origin(origin, callback) {
      // allow non-browser clients (curl/postman) with no Origin header
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error(`CORS blocked: ${origin}`), false);
    },
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Socket.IO CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "realtime" });
});

// Socket events
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join_order_room", ({ order_id }) => {
    const room = `order:${order_id}`;
    socket.join(room);
    console.log(`Client ${socket.id} joined ${room}`);
  });

  socket.on("leave_order_room", ({ order_id }) => {
    const room = `order:${order_id}`;
    socket.leave(room);
    console.log(`Client ${socket.id} left ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Helper endpoint so Laravel can push updates (protected by shared secret)
app.post("/broadcast/order-status", (req, res) => {
  const secret = req.headers["x-broadcast-secret"];
  const expected =
    process.env.REALTIME_API_SECRET || process.env.BROADCAST_SECRET;

  if (!expected || secret !== expected) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const { order_id, status } = req.body;

  if (!order_id || !status) {
    return res
      .status(422)
      .json({ ok: false, error: "order_id and status are required" });
  }

  const room = `order:${order_id}`;
  io.to(room).emit("order_status_updated", { order_id, status });

  console.log(`Broadcasted updated status(${status}) to ${room}`);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Realtime server running at http://127.0.0.1:${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ") || "(none set)"}`);
});
