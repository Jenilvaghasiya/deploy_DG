import request from "supertest";
import app from "../src/app.js";
import { connectTestDB, disconnectTestDB } from "./db.js";
import { seedDatabase, clearDatabase } from "./seed.js";

let token, testUser;

beforeAll(async () => {
    await connectTestDB();
    await clearDatabase();

    const seed = await seedDatabase();
    testUser = seed.testUser;

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

describe("Tenant API", () => {
    let createdTenant;

    it("should create a tenant", async () => {
        const res = await request(app)
            .post("/api/v1/tenants")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: `TestTenant-${Date.now()}`,
                industry_type: "Tech",
                subscription_frequency: "monthly",
            });

        expect(res.statusCode).toBe(201);
        createdTenant = res.body.data;
    });

    it("should fetch all tenants", async () => {
        const res = await request(app)
            .get("/api/v1/tenants")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should fetch a tenant by ID", async () => {
        const res = await request(app)
            .get(`/api/v1/tenants/${createdTenant.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.id).toBe(createdTenant.id);
    });

    it("should update a tenant", async () => {
        const res = await request(app)
            .put(`/api/v1/tenants/${createdTenant.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ industry_type: "Education" });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.industry_type).toBe("Education");
    });

    it("should soft delete a tenant", async () => {
        const res = await request(app)
            .delete(`/api/v1/tenants/${createdTenant.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/deleted/i);
    });
});
