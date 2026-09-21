const request = require("supertest");

const API_URL = "http://localhost:3000";

describe("Services API", () => {

    test("GET /api/services should return services successfully", async () => {

        const response = await request(API_URL)
            .get("/api/services");

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.message).toBe(
            "Services retrieved successfully"
        );

        expect(Array.isArray(response.body.services)).toBe(true);
    });

});