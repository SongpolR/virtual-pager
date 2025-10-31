import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const {
    PORT = 4000,
    RT_ALLOW_ORIGINS = "http://localhost:5173",  // web origin
    RT_API_SECRET = "changeme"                    // shared secret with Laravel
} = process.env;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: RT_ALLOW_ORIGINS.split(","), methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

io.on("connection", (socket) => {
    // Clients join a room per orderNo for efficient fanout
    socket.on("join-order", (orderNo) => socket.join(`order:${orderNo}`));
    socket.on("leave-order", (orderNo) => socket.leave(`order:${orderNo}`));
});

// Protected emit endpoint for Laravel
app.post("/emit", (req, res) => {
    const auth = req.headers["authorization"] || "";
    const token = auth.replace("Bearer ", "");
    if (token !== RT_API_SECRET) return res.status(401).json({ error: "unauthorized" });

    const { event, orderNo, payload } = req.body || {};
    if (!event || !orderNo) return res.status(400).json({ error: "bad_request" });

    // emit to the order room and to staff channel (optional)
    io.to(`order:${orderNo}`).emit(event, { orderNo, ...payload });
    io.emit(`staff:${event}`, { orderNo, ...payload }); // staff updates
    return res.json({ ok: true });
});

httpServer.listen(PORT, () => {
    console.log(`🔌 Realtime server on http://localhost:${PORT}`);
});
