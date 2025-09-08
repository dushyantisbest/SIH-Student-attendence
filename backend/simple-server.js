const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "QR Attendance API is running",
    timestamp: new Date().toISOString(),
  });
});

// Basic auth endpoint
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (email === "test@test.com" && password === "password") {
    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: "1",
          email: email,
          name: "Test User",
          role: "student",
        },
        accessToken: "fake-token",
        refreshToken: "fake-refresh-token",
      },
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

