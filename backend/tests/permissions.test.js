import request from "supertest";
import app from "../src/app.js";
import { connectTestDB, disconnectTestDB } from "./db.js";
import { seedDatabase, clearDatabase } from "./seed.js";

let token, testUser, testPermissionGroup;

beforeAll(async () => {
    await connectTestDB();
    await clearDatabase();

    const seed = await seedDatabase();
    testUser = seed.testUser;
    testPermissionGroup = seed.testPermissionGroup;

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

describe("Permission API", () => {
    let createdPermission;

    it("should create a new permission", async () => {
        const res = await request(app)
            .post("/api/v1/permissions")
            .set("Authorization", `Bearer ${token}`)
            .send({
                key: `test:create-${Date.now()}`,
                description: "Create test record",
                permission_group_id: testPermissionGroup._id,
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.key).toMatch(/test:create/);
        createdPermission = res.body.data;
    });

    it("should retrieve all permissions", async () => {
        const res = await request(app)
            .get("/api/v1/permissions")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should fetch permission by ID", async () => {
        const res = await request(app)
            .get(`/api/v1/permissions/${createdPermission.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.key).toBe(createdPermission.key);
    });

    it("should update a permission", async () => {
        const res = await request(app)
            .put(`/api/v1/permissions/${createdPermission.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ description: "Updated description" });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.description).toBe("Updated description");
    });

    it("should soft delete a permission", async () => {
        const res = await request(app)
            .delete(`/api/v1/permissions/${createdPermission.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/deleted/i);
    });
});
