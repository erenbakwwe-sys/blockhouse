import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import http from "http";
import path from "path";
import fs from "fs";
import { initialMenu, initialTables } from "./src/data/menu";

const DATA_FILE = path.join(process.cwd(), 'data.json');

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  let state = {
    orders: [] as any[],
    calls: [] as any[],
    menu: [...initialMenu],
    tables: [...initialTables],
    expenses: [] as any[],
    settings: { estimatedPrepTime: 15 }
  };

  // Load data from file if it exists
  if (fs.existsSync(DATA_FILE)) {
    try {
      const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(fileData);
      state = { ...state, ...parsed };
    } catch (e) {
      console.error('Error reading data.json', e);
    }
  }

  // Helper to save data to file
  const saveState = () => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
  };

  io.on("connection", (socket) => {
    // Send initial state to the connected client
    socket.emit("initialState", state);

    socket.on("addOrder", (order) => {
      state.orders.unshift(order);
      saveState();
      io.emit("stateUpdate", state);
      io.emit("newOrder", order);
    });

    socket.on("updateOrderStatus", ({ orderId, status }) => {
      state.orders = state.orders.map(o => o.id === orderId ? { ...o, status } : o);
      saveState();
      io.emit("stateUpdate", state);
    });

    socket.on("addCall", (call) => {
      state.calls.unshift(call);
      saveState();
      io.emit("stateUpdate", state);
      io.emit("newCall", call);
    });

    socket.on("resolveCall", (callId) => {
      state.calls = state.calls.map(c => c.id === callId ? { ...c, status: 'resolved' } : c);
      saveState();
      io.emit("stateUpdate", state);
    });

    socket.on("addMenuItem", (item) => {
      state.menu.unshift(item);
      saveState();
      io.emit("stateUpdate", state);
    });

    socket.on("updateMenuItem", ({ id, item }) => {
      state.menu = state.menu.map(m => m.id === id ? { ...m, ...item } : m);
      saveState();
      io.emit("stateUpdate", state);
    });

    socket.on("deleteMenuItem", (id) => {
      state.menu = state.menu.filter(m => m.id !== id);
      saveState();
      io.emit("stateUpdate", state);
    });

    socket.on("clearHistory", () => {
      state.orders = state.orders.filter(o => o.status !== 'served');
      state.calls = state.calls.filter(c => c.status !== 'resolved');
      saveState();
      io.emit("stateUpdate", state);
    });

    socket.on("addExpense", (expense) => {
      state.expenses.unshift(expense);
      saveState();
      io.emit("stateUpdate", state);
    });

    socket.on("deleteExpense", (id) => {
      state.expenses = state.expenses.filter(e => e.id !== id);
      saveState();
      io.emit("stateUpdate", state);
    });

    socket.on("updateSettings", (settings) => {
      state.settings = { ...state.settings, ...settings };
      saveState();
      io.emit("stateUpdate", state);
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
