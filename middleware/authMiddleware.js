const jwt = require("jsonwebtoken");

// ===============================
// JWT AUTHENTICATION MIDDLEWARE
// ===============================
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Authentication token is required."
            });
        }

        // Expected format:
        // Authorization: Bearer TOKEN
        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format. Use Bearer token."
            });
        }

        const token = parts[1];

        // Verify JWT token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Store decoded user information
        req.user = decoded;

        // Continue to protected route
        next();

    } catch (error) {
        console.error("JWT authentication error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token."
        });
    }
};

module.exports = authenticateToken;