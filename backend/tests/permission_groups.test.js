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

describe("Permission Group API", () => {
    let createdGroup;

    it("should create a permission group", async () => {
        const res = await request(app)
            .post("/api/v1/permission-groups")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: `Group ${Date.now()}`,
                description: "Test group",
            });

        expect(res.statusCode).toBe(201);
        createdGroup = res.body.data;
    });

    it("should get all permission groups", async () => {
        const res = await request(app)
            .get("/api/v1/permission-groups")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should get a permission group by ID", async () => {
        const res = await request(app)
            .get(`/api/v1/permission-groups/${createdGroup.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.id).toBe(createdGroup.id);
    });

    it("should update a permission group", async () => {
        const res = await request(app)
            .put(`/api/v1/permission-groups/${createdGroup.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ description: "Updated group description" });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.description).toBe("Updated group description");
    });

    it("should soft delete a permission group", async () => {
        const res = await request(app)
            .delete(`/api/v1/permission-groups/${createdGroup.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/deleted/i);
    });
});
