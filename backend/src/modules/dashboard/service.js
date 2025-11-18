import Session from "../sessions/model.js";
import User from "../users/model.js";
import UserAction from "../user_actions/model.js";
import AiTask from "../image_variation/model.js";
import GalleryImage from "../gallery/model.js";
import UserCredits from "../credits/model.js";
import ActivityLog from "../activity_logs/model.js";
import { ApiError } from "../../utils/ApiError.js";
import UsageLog from '../dashboard/model.js'
import { UserTime } from "./userTimeSchema.js";
import { UserModuleUsage } from "./userModuleUsageSchema.js";

export const getTimeOnPlatform = async (query) => {
    const sessions = await Session.find(query).populate(
        "userId",
        "full_name name",
    );

    const userTime = sessions.reduce((acc, session) => {
        if (session.logoutTime && session.userId) {
            const timeDiff =
                session.logoutTime.getTime() - session.loginTime.getTime();
            const hours = timeDiff / (1000 * 60 * 60);

            const userName = session.userId.full_name || session.userId.name;
            // console.log(`User: ${userName}, Time: ${hours} hours`);

            if (userName) {
                acc[userName] = (acc[userName] || 0) + hours;
            }
        }
        return acc;
    }, {});

    return Object.entries(userTime).map(([name, value]) => ({ name, value }));
};


const formatUsageTime = (data) => {
  const userTimeMap = {};

  data.forEach((item) => {
    const userId = item.user_id._id.toString();
    const fullName = item.user_id.full_name;
    const timeInSeconds = Math.floor(item.total_time / 1000); // assuming it's in ms, adjust if not

    if (!userTimeMap[userId]) {
      userTimeMap[userId] = {
        name: fullName,
        value: 0,
      };
    }

    userTimeMap[userId].value += item.total_time;
  });

  return Object.values(userTimeMap);
};

export const getTimeOnPlatformNew = async (query, tenant_id, startDateTime, endDateTime) => {
    query.tenant_id = tenant_id;
    
    // Get all UserTime documents that might contain relevant sessions
    const userTimeData = await UserTime.find(query).populate("user_id");

    // Calculate actual time spent within the specified time range
    const usageChartData = calculateTimeInRange(userTimeData, startDateTime, endDateTime);
    
    return usageChartData;
};

const calculateTimeInRange = (data, startDateTime, endDateTime) => {
    const userTimeMap = {};

    console.log(data,'data')
    console.log(startDateTime, 'startDateTime')
    console.log(endDateTime, 'endDateTime')

    data.forEach((userTimeDoc) => {
        const userId = userTimeDoc.user_id._id.toString();
        const fullName = userTimeDoc.user_id.full_name;

        if (!userTimeMap[userId]) {
            userTimeMap[userId] = {
                name: fullName,
                value: 0,
            };
        }

        userTimeDoc.sessions.forEach((session) => {
            // Skip sessions without a disconnect_time
            if (!session.disconnect_time) {
                return;
            }

            const connectTime = new Date(session.connect_time);
            const disconnectTime = new Date(session.disconnect_time);

            // Skip sessions that don't overlap with our time range at all
            if (disconnectTime < startDateTime || connectTime > endDateTime) {
                return;
            }

            const sessionStart = connectTime < startDateTime ? startDateTime : connectTime;
            const sessionEnd = disconnectTime > endDateTime ? endDateTime : disconnectTime;

            const durationInRange = sessionEnd - sessionStart;

            if (durationInRange > 0) {
                userTimeMap[userId].value += durationInRange;
            }
        });
    });

    return Object.values(userTimeMap).map(user => ({
        ...user,
        value: user.value // Still in ms
    }));
};


export const getUsageTime = async (query) => {
    const userActions = await UserAction.find(query).populate("userId", "name");

    const usageTime = userActions.reduce((acc, action) => {
        const userName = action.userId.name;
        acc[userName] = acc[userName] || {
            name: userName,
            value1: 0,
            value2: 0,
            value3: 0,
        };

        if (action.type === "ai") acc[userName].value1 += 1;
        else if (action.type === "non-ai") acc[userName].value2 += 1;
        else acc[userName].value3 += 1;

        return acc;
    }, {});


    const newUsageTime =  await UserTime.find(query).populate("user_id");

    return Object.values(usageTime);
};

// New helper function to calculate time in range for modules
const calculateModuleTimeInRange = (data, startDateTime, endDateTime) => {
    const moduleTimeMap = {};

    console.log(data, 'data');
    console.log(startDateTime, 'startDateTime');
    console.log(endDateTime, 'endDateTime');

    data.forEach((userModuleDoc) => {
        const moduleName = userModuleDoc.module;

        if (!moduleTimeMap[moduleName]) {
            moduleTimeMap[moduleName] = 0;
        }

        // Process each session to calculate time within the specified range
        userModuleDoc.sessions.forEach((session) => {
            // Skip sessions that don't have a disconnect_time (still active)
            if (!session.disconnect_time) {
                return;
            }

            const connectTime = new Date(session.connect_time);
            const disconnectTime = new Date(session.disconnect_time);

            // Skip sessions that don't overlap with our time range at all
            if (disconnectTime < startDateTime || connectTime > endDateTime) {
                return;
            }

            // Calculate the overlap between session time and our desired time range
            const sessionStart = connectTime < startDateTime ? startDateTime : connectTime;
            const sessionEnd = disconnectTime > endDateTime ? endDateTime : disconnectTime;

            // Calculate duration in milliseconds for the overlapping period
            const durationInRange = sessionEnd - sessionStart;
            
            // Only add positive durations (valid overlaps)
            if (durationInRange > 0) {
                moduleTimeMap[moduleName] += durationInRange;
            }
        });
    });

    // Convert to the expected format
    const result = Object.entries(moduleTimeMap).map(([title, time]) => ({
        title,
        time, // time in milliseconds - convert to minutes/hours as needed
    }));

    return result;
};


// Updated Service
export const getModuleUsageTimeNew = async (query, tenant_id, startDateTime, endDateTime) => {
    query.tenant_id = tenant_id;
    
    // Get all UserModuleUsage documents that might contain relevant sessions
    const userModuleUsageData = await UserModuleUsage.find(query).populate("user_id");

    // Calculate actual time spent within the specified time range
    const usageByModule = calculateModuleTimeInRange(userModuleUsageData, startDateTime, endDateTime);
    
    return usageByModule;
};


export const getOutputStats = async (query) => {
    const aiTasks = await AiTask.find(query).populate("user_id", "name");
    const galleryImages = await GalleryImage.find(query).populate(
        "user_id",
        "name",
    );

    const outputStats = aiTasks.reduce((acc, task) => {
        const userName = task.user_id.name;
        acc[userName] = acc[userName] || {
            name: userName,
            subCategories: [],
        };

        let subCategory = acc[userName].subCategories.find(
            (sc) => sc.title === task.task,
        );
        if (!subCategory) {
            subCategory = { title: task.task, generated: 0, discarded: 0 };
            acc[userName].subCategories.push(subCategory);
        }

        subCategory.generated += task.result.length;

        return acc;
    }, {});

    return Object.values(outputStats);
};

export const getOutputStatsNew = async (query) => {
  const newData = await UsageLog.find(query);

  // Define your target modules (adjust names if needed!)
  const modules = [
    'ge_variation',
    'text_to_image',
    'combine_image',
    'size_chart',
    'sketch_to_image'
  ];

  // Init result map
  const resultMap = {};
  modules.forEach(module => {
    resultMap[module] = { generated: 0, discarded: 0 };
  });

  // Process each log entry
  newData.forEach(log => {
    const moduleName = log.module;

    if (resultMap[moduleName]) {
      if (log.type === 'output_produced') {
        resultMap[moduleName].generated += log.outputCount || 1;
      } else if (log.type === 'output_discarded') {
        resultMap[moduleName].discarded += log.outputCount || 1;
      }
    }
  });

  // Build final result array
  const finalResult = modules.map(module => ({
    title: module === "ge_variation" ? "image_variation" : module,
    generated: resultMap[module].generated,
    discarded: resultMap[module].discarded
  }));

  return finalResult;
};


export const getCreditConsumption = async (query) => {
    const userCredits = await UserCredits.find(query).populate(
        "user_id",
        "name",
    );

    const creditConsumption = userCredits.reduce((acc, credit) => {
        const userName = credit.user_id.name;
        acc[userName] = acc[userName] || {
            name: userName,
            subCategories: [],
        };

        let subCategory = acc[userName].subCategories.find(
            (sc) => sc.title === "general",
        );
        if (!subCategory) {
            subCategory = { title: "general", generated: 0, discarded: 0 };
            acc[userName].subCategories.push(subCategory);
        }

        subCategory.generated += credit.credits;

        return acc;
    }, {});

    return Object.values(creditConsumption);
};
export const getCreditConsumptionNew = async (query) => {
    const newData = await UsageLog.find(query);

    // console.log('queryResult',newData)

  // Define your target modules (adjust names if needed!)
  const modules = [
    'ge_variation',
    'text_to_image',
    'combine_image',
    'size_chart',
    'sketch_to_image'
  ];

  // Init result map
  const resultMap = {};
  modules.forEach(module => {
    resultMap[module] = { generated: 0, discarded: 0 };
  });

  // Process each log entry
  newData.forEach(log => {
    const moduleName = log.module;

    if (resultMap[moduleName]) {
      if (log.type === 'credit_consumed') {
        resultMap[moduleName].generated += log.outputCount || 1;
      } else if (log.type === 'credit_consumed') {
        resultMap[moduleName].discarded += log.outputCount || 1;
      }
    }
  });

  // Build final result array
  const finalResult = modules.map(module => ({
    title: module === "ge_variation" ? "image_variation" : module,
    generated: resultMap[module].generated,
    discarded: resultMap[module].discarded
  }));

  return finalResult;
};

export const getFreeOutputs = async (query) => {
    const aiTasks = await AiTask.find({ ...query, isFree: true }).populate(
        "user_id",
        "full_name name",
    );

    // console.log("Free tasks found:", aiTasks.length);

    const freeOutputs = aiTasks.reduce((acc, task) => {
        if (!task.user_id) {
            // console.log("Task has no user_id:", task._id);
            return acc;
        }

        const userName = task.user_id.full_name || task.user_id.name;
        if (!userName) {
            // console.log("User has no name:", task.user_id._id);
            return acc;
        }

        // console.log(
        //     `Processing task for user: ${userName}, task: ${task.task}`,
        // );

        acc[userName] = acc[userName] || {
            name: userName,
            subCategories: [],
        };

        let subCategory = acc[userName].subCategories.find(
            (sc) => sc.title === task.task,
        );
        if (!subCategory) {
            subCategory = { title: task.task, generated: 0, discarded: 0 };
            acc[userName].subCategories.push(subCategory);
        }

        subCategory.generated += task.result.length;

        return acc;
    }, {});

    return Object.values(freeOutputs);
};

export const getActivityLog = async (query) => {
    const activityLogs = await ActivityLog.find(query)
        .populate("tenantId", "name")
        .populate("userId", "name");

    return activityLogs.map((log) => ({
        account: log.tenantId.name,
        date: log.date.toISOString().split("T")[0],
        logIn: log.loginTime ? log.loginTime.toLocaleTimeString() : "N/A",
        logOut: log.logoutTime ? log.logoutTime.toLocaleTimeString() : "N/A",
        request: log.request,
        requestEnd: log.requestEnd
            ? log.requestEnd.toLocaleTimeString()
            : "N/A",
        executionTime: log.executionTime,
        service: log.service,
        user: log.userId.name,
        contentGenerate: log.contentGenerate,
        contentUsed: log.contentUsed,
        discarded: log.discarded,
        creditConsumed: log.creditConsumed,
    }));
};

export const getActivityLogNew = async (query) => {
  const newLogs = await UsageLog.find(query)
    .sort({ createdAt: -1 })
    .populate('user_id', 'full_name')  
    .populate('tenant_id', 'name');   

  // console.log('newLogs', newLogs);
  return newLogs;
};

