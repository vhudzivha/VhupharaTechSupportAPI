-- Vhuphara Tech Support
-- Test database schema for automated API testing

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone_number VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    service_id SERIAL PRIMARY KEY,
    service_name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    duration INTEGER DEFAULT 0,
    image_url TEXT,
    active_status BOOLEAN DEFAULT TRUE
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    booking_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    address TEXT NOT NULL,
    problem_description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    message_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_status BOOLEAN DEFAULT FALSE
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    review_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    booking_id INTEGER NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test user
INSERT INTO users (
    full_name,
    email,
    phone_number,
    password_hash,
    address
)
VALUES (
    'Test Customer',
    'test@example.com',
    '0712345678',
    '$2b$10$abcdefghijklmnopqrstuu123456789012345678901234567890',
    'Polokwane, Limpopo'
)
ON CONFLICT (email) DO NOTHING;

-- Test services
INSERT INTO services (
    service_name,
    category,
    description,
    price,
    duration,
    image_url,
    active_status
)
VALUES
(
    'Computer Repair',
    'IT Support',
    'Computer diagnosis, repair and maintenance.',
    350.00,
    60,
    NULL,
    TRUE
),
(
    'Website Development',
    'Web Development',
    'Professional website design and development.',
    2500.00,
    480,
    NULL,
    TRUE
),
(
    'WiFi and Networking',
    'Networking',
    'Home and business WiFi and network installation.',
    750.00,
    120,
    NULL,
    TRUE
)
ON CONFLICT DO NOTHING;

-- Test booking
INSERT INTO bookings (
    customer_id,
    service_id,
    booking_date,
    booking_time,
    address,
    problem_description,
    status
)
SELECT
    u.user_id,
    s.service_id,
    CURRENT_DATE,
    '10:00:00',
    'Polokwane, Limpopo',
    'Test booking for automated API testing.',
    'Pending'
FROM users u
CROSS JOIN services s
WHERE u.email = 'test@example.com'
  AND s.service_name = 'Computer Repair'
  AND NOT EXISTS (
      SELECT 1
      FROM bookings b
      WHERE b.problem_description = 'Test booking for automated API testing.'
  );

-- Test notification
INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    read_status
)
SELECT
    user_id,
    'Test Notification',
    'This notification is used for automated API testing.',
    'booking',
    FALSE
FROM users
WHERE email = 'test@example.com'
AND NOT EXISTS (
    SELECT 1
    FROM notifications n
    WHERE n.title = 'Test Notification'
);

-- Test message
INSERT INTO messages (
    booking_id,
    sender_id,
    receiver_id,
    message,
    read_status
)
SELECT
    b.booking_id,
    u.user_id,
    u.user_id,
    'Test message for automated API testing.',
    FALSE
FROM bookings b
JOIN users u ON u.email = 'test@example.com'
WHERE b.problem_description = 'Test booking for automated API testing.'
AND NOT EXISTS (
    SELECT 1
    FROM messages m
    WHERE m.message = 'Test message for automated API testing.'
);

-- Test review
INSERT INTO reviews (
    customer_id,
    booking_id,
    rating,
    comment
)
SELECT
    u.user_id,
    b.booking_id,
    5,
    'Test review for automated API testing.'
FROM users u
JOIN bookings b ON b.customer_id = u.user_id
WHERE u.email = 'test@example.com'
AND b.problem_description = 'Test booking for automated API testing.'
AND NOT EXISTS (
    SELECT 1
    FROM reviews r
    WHERE r.comment = 'Test review for automated API testing.'
);