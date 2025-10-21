import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());

let orders = [];

// Create new order
app.post("/api/order", (req, res) => {
    const orderNo = (Math.floor(Math.random() * 900) + 100).toString();
    const order = { orderNo, status: "PREPARING" };
    orders.push(order);
    res.json({ ok: true, order });
});

// List orders
app.get("/api/orders", (req, res) => res.json(orders));

// Mark as ready
app.post("/api/orders/:no/ready", (req, res) => {
    const order = orders.find(o => o.orderNo === req.params.no);
    if (!order) return res.status(404).json({ error: "Not found" });
    order.status = "READY";
    io.emit("order-status", order);
    res.json({ ok: true });
});

// Mark as done (stop ding)
app.post("/api/orders/:no/done", (req, res) => {
    const order = orders.find(o => o.orderNo === req.params.no);
    if (!order) return res.status(404).json({ error: "Not found" });
    order.status = "DONE";
    io.emit("order-status", order);
    res.json({ ok: true });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`🚀 Running at http://localhost:${PORT}`));
