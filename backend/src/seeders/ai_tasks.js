import AiTask from '../modules/image_variation/model.js';
import User from '../modules/users/model.js';

export const seedAiTasks = async () => {
    const users = await User.find({});

    if (users.length === 0) {
        console.warn("⚠️ No users found. Please seed users first.");
        return;
    }

    const aiTasksToSeed = [
        {
            userEmail: "alice.smith@example.com",
            task: "image_variation",
            task_id: "task_var_001",
            result: ["http://example.com/img_var_001.jpg"],
            status: "completed",
            isFree: false,
        },
        {
            userEmail: "bob.johnson@example.com",
            task: "text_to_image",
            task_id: "task_txt_001",
            result: ["http://example.com/txt_img_001.jpg", "http://example.com/txt_img_002.jpg"],
            status: "completed",
            isFree: true,
        },
        {
            userEmail: "alice.smith@example.com",
            task: "sketch_to_image",
            task_id: "task_sk_001",
            result: ["http://example.com/sk_img_001.jpg"],
            status: "failed",
            isFree: false,
        },
        {
            userEmail: "charlie.brown@example.com",
            task: "combine_image",
            task_id: "task_comb_001",
            result: ["http://example.com/comb_img_001.jpg"],
            status: "completed",
            isFree: true,
        },
        {
            userEmail: "diana.prince@example.com",
            task: "image_variation",
            task_id: "task_var_002",
            result: ["http://example.com/img_var_002.jpg", "http://example.com/img_var_003.jpg"],
            status: "queued",
            isFree: false,
        },
    ];

    for (const taskData of aiTasksToSeed) {
        const user = users.find(u => u.email === taskData.userEmail);

        if (user) {
            const existingTask = await AiTask.findOne({ task_id: taskData.task_id });

            if (!existingTask) {
                await AiTask.create({
                    user_id: user._id,
                    task: taskData.task,
                    task_id: taskData.task_id,
                    result: taskData.result,
                    status: taskData.status,
                    isFree: taskData.isFree,
                });
                console.log(`✅ AiTask '${taskData.task_id}' seeded for user: ${taskData.userEmail}`);
            } else {
                console.log(`⏭️ AiTask '${taskData.task_id}' already exists, skipping`);
            }
        } else {
            console.warn(`⚠️ Skipping AiTask for user '${taskData.userEmail}': User not found.`);
        }
    }
};