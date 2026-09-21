const request = require("supertest");

const API_URL = "http://localhost:3000";

describe("Reviews API", () => {

    test("GET /api/reviews/booking/1 should return reviews successfully", async () => {

        const response = await request(API_URL)
            .get("/api/reviews/booking/1");

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.message).toBe(
            "Reviews retrieved successfully"
        );

        expect(Array.isArray(response.body.reviews)).toBe(true);
    });

});