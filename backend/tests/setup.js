import { connectTestDB, disconnectTestDB } from "./db.js";
import { clearDatabase } from "./seed.js";

beforeAll(async () => {
    await connectTestDB();
});

afterAll(async () => {
    await clearDatabase();
    await disconnectTestDB();
});
