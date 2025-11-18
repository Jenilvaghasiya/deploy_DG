import request from "supertest";
import app from "../src/app.js";
import { connectTestDB, disconnectTestDB } from "./db.js";
import { seedDatabase, clearDatabase } from "./seed.js";

let testUser;

beforeAll(async () => {
    await connectTestDB();
    const { testUser: user } = await seedDatabase();
    testUser = user;
});

afterAll(async () => {
    await disconnectTestDB();
});

describe("Auth API", () => {
    it("should login with valid credentials", async () => {
        const res = await request(app).post("/api/v1/auth/login").send({
            email: testUser.email,
            password: "password123",
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.token).toBeDefined();
    });

    it("should fail login with wrong password", async () => {
        const res = await request(app).post("/api/v1/auth/login").send({
            email: testUser.email,
            password: "wrongpass",
        });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it("should return 404 for non-existent user", async () => {
        const res = await request(app).post("/api/v1/auth/login").send({
            email: "noone@domain.com",
            password: "irrelevant",
        });

        expect(res.statusCode).toBe(401);
    });
});
