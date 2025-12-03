// realtime/server.js

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "realtime" });
});

// Socket events
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // 👇 JOIN order room
  socket.on("join_order_room", ({ order_id }) => {
    const room = `order:${order_id}`;
    socket.join(room);
    console.log(`Client ${socket.id} joined ${room}`);
  });

  // 👇 LEAVE order room
  socket.on("leave_order_room", ({ order_id }) => {
    const room = `order:${order_id}`;
    socket.leave(room);
    console.log(`Client ${socket.id} left ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// 💡 This is a helper endpoint so Laravel can push updates
app.post("/broadcast/order-status", (req, res) => {
  const { order_id, status } = req.body;

  const room = `order:${order_id}`;
  io.to(room).emit("order_status_updated", { order_id, status });

  console.log(`Broadcasted updated status(${status}) to ${room}`);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`Realtime server running at http://localhost:${PORT}`)
);
