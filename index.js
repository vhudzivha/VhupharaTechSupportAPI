const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const pool = require("./db");
const authenticateToken = require("./middleware/authMiddleware");

const app = express();

const PORT = process.env.PORT || 3000;

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());


// ===============================
// HOME ROUTE
// ===============================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Vhuphara & Vhudzivha Tech Support API is running"
    });
});


// ===============================
// API TEST ROUTE
// ===============================

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "API connection is working"
    });
});


// ===============================
// POSTGRESQL DATABASE TEST
// ===============================

app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT NOW() AS current_time"
        );

        res.json({
            success: true,
            message: "PostgreSQL database connection is working",
            database: process.env.DB_NAME,
            time: result.rows[0].current_time
        });

    } catch (error) {

        console.error("Database connection error:", error);

        res.status(500).json({
            success: false,
            message: "PostgreSQL database connection failed",
            error: error.message
        });
    }
});

// ==========================================
// GET ALL ACTIVE SERVICES
// ==========================================
app.get("/api/services", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                service_id,
                service_name,
                category,
                description,
                price,
                duration,
                image_url,
                active_status
             FROM services
             WHERE active_status = true
             ORDER BY service_id ASC`
        );

        res.status(200).json({
            success: true,
            message: "Services retrieved successfully",
            count: result.rows.length,
            services: result.rows
        });

    } catch (error) {
        console.error("Get services error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve services"
        });
    }
});


// ==========================================
// GET SINGLE SERVICE BY ID
// ==========================================
app.get("/api/services/:id", async (req, res) => {
    try {
        const serviceId = parseInt(req.params.id);

        if (isNaN(serviceId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid service ID"
            });
        }

        const result = await pool.query(
            `SELECT
                service_id,
                service_name,
                category,
                description,
                price,
                duration,
                image_url,
                active_status
             FROM services
             WHERE service_id = $1
             AND active_status = true`,
            [serviceId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Service retrieved successfully",
            service: result.rows[0]
        });

    } catch (error) {
        console.error("Get service error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve service"
        });
    }
});

// ==========================================
// CREATE NEW SERVICE BOOKING
// ==========================================
app.post("/api/bookings", async (req, res) => {
    try {
        const {
            customer_id,
            service_id,
            booking_date,
            booking_time,
            address,
            problem_description
        } = req.body;

        // Validate required fields
        if (
            !customer_id ||
            !service_id ||
            !booking_date ||
            !booking_time ||
            !address ||
            !problem_description
        ) {
            return res.status(400).json({
                success: false,
                message: "All booking fields are required"
            });
        }

        // Check if customer exists
        const customerResult = await pool.query(
            `SELECT user_id
             FROM users
             WHERE user_id = $1`,
            [customer_id]
        );

        if (customerResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Check if service exists and is active
        const serviceResult = await pool.query(
            `SELECT service_id, service_name
             FROM services
             WHERE service_id = $1
             AND active_status = true`,
            [service_id]
        );

        if (serviceResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service not found or inactive"
            });
        }

        // Create booking
        const result = await pool.query(
            `INSERT INTO bookings
                (
                    customer_id,
                    service_id,
                    booking_date,
                    booking_time,
                    address,
                    problem_description,
                    status,
                    created_at
                )
             VALUES
                ($1, $2, $3, $4, $5, $6, 'Pending', NOW())
             RETURNING
                booking_id,
                customer_id,
                service_id,
                booking_date,
                booking_time,
                address,
                problem_description,
                status,
                created_at`,
            [
                customer_id,
                service_id,
                booking_date,
                booking_time,
                address,
                problem_description
            ]
        );

        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            booking: result.rows[0]
        });

    } catch (error) {
        console.error("Create booking error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create booking"
        });
    }
});

// ==========================================
// GET CUSTOMER BOOKINGS
// ==========================================
app.get("/api/bookings/customer/:customerId", async (req, res) => {
    try {
        const customerId = parseInt(req.params.customerId);

        // Validate customer ID
        if (isNaN(customerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }

        // Get customer's bookings
        const result = await pool.query(
            `SELECT
                b.booking_id,
                b.customer_id,
                b.service_id,
                s.service_name,
                s.category,
                s.price,
                b.booking_date,
                b.booking_time,
                b.address,
                b.problem_description,
                b.status,
                b.created_at
             FROM bookings b
             INNER JOIN services s
                ON b.service_id = s.service_id
             WHERE b.customer_id = $1
             ORDER BY b.booking_id DESC`,
            [customerId]
        );

        res.status(200).json({
            success: true,
            message: "Customer bookings retrieved successfully",
            count: result.rows.length,
            bookings: result.rows
        });

    } catch (error) {
        console.error("Get customer bookings error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve customer bookings"
        });
    }
});

// ==========================================
// GET BOOKING STATUS / TRACKING
// ==========================================
app.get("/api/bookings/:id/status", async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);

        // Validate booking ID
        if (isNaN(bookingId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID"
            });
        }

        // Get booking status
        const result = await pool.query(
            `SELECT
                b.booking_id,
                b.customer_id,
                b.service_id,
                s.service_name,
                s.category,
                b.booking_date,
                b.booking_time,
                b.address,
                b.problem_description,
                b.status,
                b.created_at
             FROM bookings b
             INNER JOIN services s
                ON b.service_id = s.service_id
             WHERE b.booking_id = $1`,
            [bookingId]
        );

        // Booking does not exist
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const booking = result.rows[0];

        res.status(200).json({
            success: true,
            message: "Booking status retrieved successfully",
            booking: booking
        });

    } catch (error) {
        console.error("Get booking status error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve booking status"
        });
    }
});

// ==========================================
// UPDATE BOOKING STATUS
// ==========================================
app.put("/api/bookings/:id/status", async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const { status } = req.body;

        // Validate booking ID
        if (isNaN(bookingId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID"
            });
        }

        // Allowed booking statuses
        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "In Progress",
            "Completed",
            "Cancelled"
        ];

        // Validate status
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking status",
                allowedStatuses: allowedStatuses
            });
        }

        // Update booking status
        const result = await pool.query(
            `UPDATE bookings
             SET status = $1
             WHERE booking_id = $2
             RETURNING
                booking_id,
                customer_id,
                service_id,
                booking_date,
                booking_time,
                address,
                problem_description,
                status,
                created_at`,
            [status, bookingId]
        );

        // Booking does not exist
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Booking status updated successfully",
            booking: result.rows[0]
        });

    } catch (error) {
        console.error("Update booking status error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update booking status"
        });
    }
});

// ==========================================
// GET USER NOTIFICATIONS
// ==========================================
app.get("/api/notifications/:userId", async (req, res) => {

    try {

        const userId = parseInt(req.params.userId);

        // Validate user ID
        if (isNaN(userId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });

        }

        // Get notifications for the user
        const result = await pool.query(
            `SELECT
                notification_id,
                user_id,
                title,
                message,
                type,
                read_status,
                created_at
             FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );

        res.status(200).json({

            success: true,

            message: "Notifications retrieved successfully",

            count: result.rows.length,

            notifications: result.rows

        });

    } catch (error) {

        console.error("Get notifications error:", error);

        res.status(500).json({

            success: false,

            message: "Failed to retrieve notifications"

        });

    }

});


// ==========================================
// MARK NOTIFICATION AS READ
// ==========================================
app.put("/api/notifications/:notificationId/read", async (req, res) => {

    try {

        const notificationId = parseInt(req.params.notificationId);

        // Validate notification ID
        if (isNaN(notificationId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid notification ID"
            });

        }

        // Mark notification as read
        const result = await pool.query(
            `UPDATE notifications
             SET read_status = true
             WHERE notification_id = $1
             RETURNING
                notification_id,
                user_id,
                title,
                message,
                type,
                read_status,
                created_at`,
            [notificationId]
        );

        // Notification does not exist
        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });

        }

        res.status(200).json({

            success: true,

            message: "Notification marked as read",

            notification: result.rows[0]

        });

    } catch (error) {

        console.error("Mark notification read error:", error);

        res.status(500).json({

            success: false,

            message: "Failed to update notification"

        });

    }

});// ==========================================
   // GET USER NOTIFICATIONS
   // ==========================================
   app.get("/api/notifications/:userId", async (req, res) => {

       try {

           const userId = parseInt(req.params.userId);

           // Validate user ID
           if (isNaN(userId)) {

               return res.status(400).json({
                   success: false,
                   message: "Invalid user ID"
               });

           }

           // Get notifications for the user
           const result = await pool.query(
               `SELECT
                   notification_id,
                   user_id,
                   title,
                   message,
                   type,
                   read_status,
                   created_at
                FROM notifications
                WHERE user_id = $1
                ORDER BY created_at DESC`,
               [userId]
           );

           res.status(200).json({

               success: true,

               message: "Notifications retrieved successfully",

               count: result.rows.length,

               notifications: result.rows

           });

       } catch (error) {

           console.error("Get notifications error:", error);

           res.status(500).json({

               success: false,

               message: "Failed to retrieve notifications"

           });

       }

   });


   // ==========================================
   // MARK NOTIFICATION AS READ
   // ==========================================
   app.put("/api/notifications/:notificationId/read", async (req, res) => {

       try {

           const notificationId = parseInt(req.params.notificationId);

           // Validate notification ID
           if (isNaN(notificationId)) {

               return res.status(400).json({
                   success: false,
                   message: "Invalid notification ID"
               });

           }

           // Mark notification as read
           const result = await pool.query(
               `UPDATE notifications
                SET read_status = true
                WHERE notification_id = $1
                RETURNING
                   notification_id,
                   user_id,
                   title,
                   message,
                   type,
                   read_status,
                   created_at`,
               [notificationId]
           );

           // Notification does not exist
           if (result.rows.length === 0) {

               return res.status(404).json({
                   success: false,
                   message: "Notification not found"
               });

           }

           res.status(200).json({

               success: true,

               message: "Notification marked as read",

               notification: result.rows[0]

           });

       } catch (error) {

           console.error("Mark notification read error:", error);

           res.status(500).json({

               success: false,

               message: "Failed to update notification"

           });

       }

   });



// ===============================
// USER REGISTRATION
// ===============================

app.post("/api/auth/register", async (req, res) => {

    try {

        const {
            full_name,
            email,
            phone_number,
            password,
            address
        } = req.body;


        // Validate required fields

        if (!full_name || !email || !phone_number || !password) {

            return res.status(400).json({
                success: false,
                message: "Full name, email, phone number and password are required"
            });
        }


        // Check if email already exists

        const existingUser = await pool.query(
            "SELECT user_id FROM users WHERE email = $1",
            [email]
        );


        if (existingUser.rows.length > 0) {

            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }


        // Hash password

        const passwordHash = await bcrypt.hash(password, 10);


        // Insert new user

        const result = await pool.query(
            `INSERT INTO users
            (full_name, email, phone_number, password_hash, address)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_id, full_name, email, phone_number, address, created_at`,
            [
                full_name,
                email,
                phone_number,
                passwordHash,
                address || null
            ]
        );


        res.status(201).json({
            success: true,
            message: "Registration successful",
            user: result.rows[0]
        });


    } catch (error) {

        console.error("Registration error:", error);

        res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message
        });
    }
});


// ===============================
// USER LOGIN
// ===============================

app.post("/api/auth/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        // Validate required fields

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }


        // Find user by email

        const result = await pool.query(
            `SELECT
                user_id,
                full_name,
                email,
                phone_number,
                address,
                password_hash
             FROM users
             WHERE email = $1`,
            [email]
        );


        // Check if user exists

        if (result.rows.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }


        const user = result.rows[0];


        // Compare password

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );


        if (!passwordMatch) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }


        // Create JWT token

        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );


        // Remove password hash

        delete user.password_hash;


        // Send login response

        res.status(200).json({

            success: true,

            message: "Login successful",

            token: token,

            user: user

        });


    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({

            success: false,

            message: "Login failed",

            error: error.message

        });
    }
});


// ===============================
// PROTECTED JWT TEST ROUTE
// ===============================
//
// IMPORTANT:
// This route MUST be OUTSIDE the login route.
//
// The user must send:
// Authorization: Bearer TOKEN
//

app.get("/api/auth/me", authenticateToken, (req, res) => {

    res.status(200).json({

        success: true,

        message: "JWT Authentication is working",

        user: req.user

    });

});


// ===============================
// PROTECTED AUTHENTICATION TEST
// ===============================

app.get("/api/auth/protected", authenticateToken, (req, res) => {

    res.status(200).json({

        success: true,

        message: "JWT authentication is working",

        user: req.user

    });

});


// ===============================
// START SERVER
// ===============================

const server = app.listen(PORT, () => {

    console.log(
        `Vhuphara Tech Support API running on port ${PORT}`
    );

});


// ===============================
// SERVER ERROR HANDLING
// ===============================

server.on("error", (error) => {

    console.error("Server error:", error);

});


// ===============================
// UNEXPECTED ERROR HANDLING
// ===============================

process.on("uncaughtException", (error) => {

    console.error("Uncaught Exception:", error);

});

process.on("unhandledRejection", (error) => {

    console.error("Unhandled Rejection:", error);

});

// ===============================
// MESSAGES API
// ===============================

// GET messages for a booking
app.get("/api/messages/booking/:bookingId", async (req, res) => {
    const { bookingId } = req.params;

    try {
        const result = await pool.query(
            `SELECT
                message_id,
                booking_id,
                sender_id,
                receiver_id,
                message,
                sent_at,
                read_status
             FROM messages
             WHERE booking_id = $1
             ORDER BY sent_at ASC`,
            [bookingId]
        );

        res.status(200).json({
            success: true,
            message: "Messages retrieved successfully",
            count: result.rows.length,
            messages: result.rows
        });

    } catch (error) {
        console.error("Get messages error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve messages"
        });
    }
});


// SEND a new message
app.post("/api/messages", async (req, res) => {
    const {
        booking_id,
        sender_id,
        receiver_id,
        message
    } = req.body;

    if (!booking_id || !sender_id || !receiver_id || !message) {
        return res.status(400).json({
            success: false,
            message: "booking_id, sender_id, receiver_id and message are required"
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO messages
                (booking_id, sender_id, receiver_id, message, sent_at, read_status)
             VALUES
                ($1, $2, $3, $4, NOW(), false)
             RETURNING
                message_id,
                booking_id,
                sender_id,
                receiver_id,
                message,
                sent_at,
                read_status`,
            [
                booking_id,
                sender_id,
                receiver_id,
                message
            ]
        );

        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Send message error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to send message"
        });
    }
});

// ======================================================
// REVIEWS & RATINGS API
// ======================================================

// GET reviews for a booking
app.get('/api/reviews/booking/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;

        const result = await pool.query(
            `SELECT
                review_id,
                customer_id,
                booking_id,
                rating,
                comment,
                created_at
             FROM reviews
             WHERE booking_id = $1
             ORDER BY created_at DESC`,
            [bookingId]
        );

        res.json({
            success: true,
            message: 'Reviews retrieved successfully',
            count: result.rows.length,
            reviews: result.rows
        });

    } catch (error) {
        console.error('Get reviews error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve reviews'
        });
    }
});


// CREATE a new review
app.post('/api/reviews', async (req, res) => {
    try {
        const {
            customer_id,
            booking_id,
            rating,
            comment
        } = req.body;

        // Validate rating
        if (!customer_id || !booking_id || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID, booking ID and rating are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const result = await pool.query(
            `INSERT INTO reviews
                (customer_id, booking_id, rating, comment)
             VALUES ($1, $2, $3, $4)
             RETURNING
                review_id,
                customer_id,
                booking_id,
                rating,
                comment,
                created_at`,
            [
                customer_id,
                booking_id,
                rating,
                comment || ''
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review: result.rows[0]
        });

    } catch (error) {
        console.error('Create review error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to submit review'
        });
    }
});



// ======================================================
// GET NOTIFICATIONS FOR A USER
// ======================================================

app.get("/api/notifications/:userId", async (req, res) => {

    const userId = parseInt(req.params.userId);

    if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
    }

    try {

        const result = await pool.query(
            `
            SELECT
                notification_id,
                user_id,
                title,
                message,
                type,
                read_status,
                created_at
            FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
            `,
            [userId]
        );

        res.status(200).json({
            success: true,
            message: "Notifications retrieved successfully",
            count: result.rows.length,
            notifications: result.rows
        });

    } catch (error) {

        console.error("Get notifications error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve notifications"
        });
    }
});