# Vhuphara & Vhudzivha Tech Support API

## Project Overview

The Vhuphara & Vhudzivha Tech Support API is a RESTful backend developed to support the Vhuphara & Vhudzivha Tech Support Android application.

The system provides backend services for customers to register and log in, view IT services, create service bookings, track bookings, receive notifications, exchange messages and submit service reviews.

The API communicates with a PostgreSQL database and is designed to support the Android mobile application through REST API requests and JSON responses.

---

## Purpose of the Application

The application is designed for customers who need IT support and technology-related services.

Customers can use the Android application to:

- Create an account
- Log in securely
- View available IT services
- Book an IT service
- Provide service address and problem information
- Track booking status
- View notifications
- Send and receive service-related messages
- Submit ratings and reviews
- View rewards information
- Manage application settings

---

## Technology Stack

### Backend

- Node.js
- Express.js
- JavaScript
- PostgreSQL
- REST API
- JSON

### Security

- bcryptjs for password hashing
- JSON Web Tokens (JWT) for authentication
- dotenv for environment configuration
- HTTPS/secure hosting can be used when deployed

### Testing

- Jest
- Supertest

### Android Application

The backend is designed to communicate with the Vhuphara & Vhudzivha Tech Support Android application.

---

## Project Architecture

The application follows a client-server architecture.

```text
Android Application
        |
        | REST API / JSON
        |
        v
Node.js + Express REST API
        |
        | SQL Queries
        |
        v
PostgreSQL Database
