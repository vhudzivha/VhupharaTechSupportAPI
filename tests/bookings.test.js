const request = require("supertest");

const API_URL = "http://localhost:3000";

describe("Booking API", () => {

    test("GET /api/bookings/customer/1 should return customer bookings", async () => {

        const response = await request(API_URL)
            .get("/api/bookings/customer/1");

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("bookings");

    });

    test("GET /api/bookings/1/status should return booking status", async () => {

        const response = await request(API_URL)
            .get("/api/bookings/1/status");

        expect([200, 404]).toContain(response.statusCode);

    });

});