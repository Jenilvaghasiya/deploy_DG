import request from "supertest";
import app from "../src/app.js";
import { connectTestDB, disconnectTestDB } from "./db.js";
import { seedDatabase, clearDatabase } from "./seed.js";

let token, testUser, testPermissionGroup, testPermissions;

beforeAll(async () => {
    await connectTestDB();
    await clearDatabase();

    const seed = await seedDatabase();
    testUser = seed.testUser;
    testPermissionGroup = seed.testPermissionGroup;
    testPermissions = seed.testPermissions;

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

describe("Role API", () => {
    let createdRole;

    it("should create a new role", async () => {
        const res = await request(app)
            .post("/api/v1/roles")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "manager",
                description: "Manager role",
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.name).toBe("manager");
        createdRole = res.body.data;
    });

    it("should not allow duplicate role names", async () => {
        const res = await request(app)
            .post("/api/v1/roles")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "manager", // duplicate
                description: "Duplicate role",
            });

        expect(res.statusCode).toBe(409);
    });

    it("should update role details", async () => {
        const res = await request(app)
            .put(`/api/v1/roles/${createdRole.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                description: "Updated manager role",
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.description).toBe("Updated manager role");
    });

    it("should assign permissions to a role", async () => {
        const res = await request(app)
            .post(`/api/v1/rbac/assign`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                role_id: createdRole.id,
                permission_ids: testPermissions.map((p) => p._id),
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.permissions).toEqual(
            expect.arrayContaining(
                testPermissions.map((p) => p._id.toString()),
            ),
        );
    });

    it("should retrieve role permissions grouped", async () => {
        const res = await request(app)
            .get(`/api/v1/rbac/${createdRole.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data[0].group_name).toBe("Project Management");
        expect(res.body.data[0].permissions.length).toBeGreaterThan(0);
    });

    it("should delete the role (soft delete)", async () => {
        const res = await request(app)
            .delete(`/api/v1/roles/${createdRole.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/deleted/i);
    });
});
