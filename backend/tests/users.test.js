import request from "supertest";
import app from "../src/app.js";
import { connectTestDB, disconnectTestDB } from "./db.js";
import { seedDatabase, clearDatabase } from "./seed.js";

let token, testUser, testRole, testTenant;

beforeAll(async () => {
    await connectTestDB();
    await clearDatabase();

    const seed = await seedDatabase();
    testUser = seed.testUser;
    testRole = seed.testRole;
    testTenant = seed.testTenant;

    const res = await request(app).post("/api/v1/auth/login").send({
        email: testUser.email,
        password: "password123",
    });

    token = res.body.data.token;
});

afterAll(async () => {
    await clearDatabase();
    await disconnectTestDB();
});

describe("User API", () => {
    let createdUser;

    it("should fetch all users", async () => {
        const res = await request(app)
            .get("/api/v1/users")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should fetch user profile", async () => {
        const res = await request(app)
            .get("/api/v1/users/me")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.email).toBe(testUser.email);
    });

    it("should fetch a user by ID", async () => {
        const res = await request(app)
            .get(`/api/v1/users/${testUser.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.email).toBe(testUser.email);
    });

    it("should update a user", async () => {
        const res = await request(app)
            .put(`/api/v1/users/${testUser.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ full_name: "UpdatedTester" });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.full_name).toBe("UpdatedTester");
    });

    it("should soft delete the user", async () => {
        const res = await request(app)
            .delete(`/api/v1/users/${testUser.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/deleted/i);
    });
});
