import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import path from "path";
import session from "express-session";

import connectDB from "./utils/database";
import { logger } from "./utils/logger";
import routes from "./routes";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Connect to database
connectDB();

// Security middleware (without CSP for inline scripts)
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1);

// API routes
app.use("/api", routes);

// Web routes
app.get('/', (req, res) => {
  if ((req.session as any).user) {
    res.render('dashboard', { user: (req.session as any).user });
  } else {
    res.render('login');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/dashboard', (req, res) => {
  if (!(req.session as any).user) {
    return res.redirect('/login');
  }
  res.render('dashboard', { user: (req.session as any).user });
});

app.get('/scan', (req, res) => {
  if (!(req.session as any).user) {
    return res.redirect('/login');
  }
  res.render('scan', { user: (req.session as any).user });
});

app.get('/attendance-history', (req, res) => {
  if (!(req.session as any).user) {
    return res.redirect('/login');
  }
  res.render('attendance-history', { user: (req.session as any).user });
});

app.get('/session-attendance', (req, res) => {
  if (!(req.session as any).user || (req.session as any).user.role !== 'teacher') {
    return res.redirect('/dashboard');
  }
  res.render('session-attendance', { user: (req.session as any).user });
});

app.get('/sessions', (req, res) => {
  if (!(req.session as any).user) {
    return res.redirect('/login');
  }
  res.render('sessions', { user: (req.session as any).user });
});

app.get('/create-session', (req, res) => {
  if (!(req.session as any).user || (req.session as any).user.role !== 'teacher') {
    return res.redirect('/dashboard');
  }
  res.render('create-session', { user: (req.session as any).user });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Socket.io connection handling
io.on("connection", (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Join session room
  socket.on("join-session", (sessionId) => {
    socket.join(`session-${sessionId}`);
    logger.info(`Client ${socket.id} joined session ${sessionId}`);
  });

  // Leave session room
  socket.on("leave-session", (sessionId) => {
    socket.leave(`session-${sessionId}`);
    logger.info(`Client ${socket.id} left session ${sessionId}`);
  });

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Make io available to other modules
app.set("io", io);

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error("Global error handler:", err);

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).render('404');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});

export default app;

