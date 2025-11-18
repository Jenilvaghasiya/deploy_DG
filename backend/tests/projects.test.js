import request from "supertest";
import app from "../src/app.js";
import { connectTestDB, disconnectTestDB } from "./db.js";
import { seedDatabase, clearDatabase } from "./seed.js";
import mongoose from "mongoose";

let testUser, testTenant, testProject, anotherProject, token;

beforeAll(async () => {
    await connectTestDB();
    await clearDatabase();

    const seed = await seedDatabase();
    testUser = seed.testUser;
    testTenant = seed.testTenant;
    testProject = seed.testProject;

    anotherProject = await seed.testProject.constructor.create({
        name: "Another Project",
        description: "Used for user add/remove tests",
        tenant_id: testTenant._id,
        user_ids: [],
        created_by: testUser._id,
    });

    const res = await request(app).post("/api/v1/auth/login").send({
        email: testUser.email,
        password: "password123",
    });

    token = res.body.data.token;
});

afterAll(async () => {
    await disconnectTestDB();
});

describe("Project API", () => {
    it("should create a new project", async () => {
        const res = await request(app)
            .post("/api/v1/projects")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "New Project",
                description: "Another test project",
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.name).toBe("New Project");
    });

    it("should fetch all projects", async () => {
        const res = await request(app)
            .get("/api/v1/projects")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should fetch single project by ID", async () => {
        const res = await request(app)
            .get(`/api/v1/projects/${anotherProject._id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.name).toBe(anotherProject.name);
    });

    it("should update a project", async () => {
        const res = await request(app)
            .put(`/api/v1/projects/${anotherProject._id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Updated Project Name" });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.name).toBe("Updated Project Name");
    });

    it("should add a user to a project", async () => {
        const res = await request(app)
            .post(`/api/v1/projects/${anotherProject._id}/users`)
            .set("Authorization", `Bearer ${token}`)
            .send({ user_id: testUser._id });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.user_ids).toContainEqual(testUser._id.toString());
    });

    it("should remove a user from a project", async () => {
        const res = await request(app)
            .delete(`/api/v1/projects/${anotherProject._id}/users`)
            .set("Authorization", `Bearer ${token}`)
            .send({ user_id: testUser._id });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.user_ids).not.toContainEqual(
            testUser._id.toString(),
        );
    });

    it("should soft delete a project", async () => {
        const res = await request(app)
            .delete(`/api/v1/projects/${testProject._id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/deleted/i);
    });
});
