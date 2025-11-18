import jwt from "jsonwebtoken";
import { UserTime } from "../modules/dashboard/userTimeSchema.js";
import { UserModuleUsage } from "../modules/dashboard/userModuleUsageSchema.js";
import AiTask from "../modules/image_variation/model.js"

const decodeSocketToken = (socket, next) => {
	const token = socket.handshake.auth?.token;
	if (!token) return next(new Error("Authentication error"));

	jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
		if (err) return next(new Error("Invalid token"));
		socket.user = decoded; // Attach user info to socket
		next();
	});
};

export const setupSocket = (io) => {

    io.use(decodeSocketToken)

    io.on("connection", (socket) => {
        console.log("🟢 New client connected:", socket.id);

        handleUserSocketConnect(socket, io);

        socket.on("join", ({ tenant_id, user_id }) => {
            socket.join(tenant_id);
            socket.join(user_id); // for DMs
            console.log(`User ${user_id} joined tenant ${tenant_id}`);
        });

        socket.on("broadcast-message", (data) => {
            io.to(data.tenant_id).emit("receive-broadcast", data);
        });

        socket.on("send-dm", (data) => {
            io.to(data.recipient_id).emit("receive-dm", data);
        });
        socket.on("usage-time-start", (data) => {
            const user = socket.user;
            console.log("Usage time data received:", data, user);
            handleUsageTimeStart(socket, data);
        });
        socket.on("usage-time-end", (data) => {
            const user = socket.user;
            console.log("Usage time data received:", data, user);
            handleUsageTimeEnd(socket, data);
        });

        socket.on("disconnect", () => {
            console.log("🔴 Client disconnected:", socket.id);
            handleUserSocketDisconnect(socket);
        });
    });
};

const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

const getPreviousDate = (daysAgo = 1) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0); // Normalize to midnight
  date.setDate(date.getDate() - daysAgo);
  return date;
};

// Helper function to calculate session duration
const calculateSessionDuration = (connectTime, disconnectTime) => {
    return disconnectTime.getTime() - connectTime.getTime();
};

const optimizeSessions = (sessions) => {
    // Remove sessions with 0 duration
    let filteredSessions = sessions.filter(session => session.duration > 0);
    
    // If still more than 10, merge oldest sessions
    if (filteredSessions.length > 10) {
        // Sort by connect_time to ensure chronological order
        filteredSessions.sort((a, b) => new Date(a.connect_time) - new Date(b.connect_time));
        
        // Keep the last 9 sessions and merge the rest into one
        const sessionsToMerge = filteredSessions.slice(0, filteredSessions.length - 9);
        const sessionsToKeep = filteredSessions.slice(filteredSessions.length - 9);
        
        if (sessionsToMerge.length > 0) {
            // Create merged session
            const mergedSession = {
                connect_time: sessionsToMerge[0].connect_time,
                disconnect_time: sessionsToMerge[sessionsToMerge.length - 1].disconnect_time,
                duration: sessionsToMerge.reduce((total, session) => total + session.duration, 0),
                is_merged: true // Flag to indicate this is a merged session
            };
            
            // Return merged session + kept sessions
            filteredSessions = [mergedSession, ...sessionsToKeep];
        }
    }
    
    return filteredSessions;
};
const getTodayLastDisconnectTime = async (userId, tenantId) => {
    const today = getTodayDate(); // format: YYYY-MM-DD
    console.log("📅 Today:", today);

    const record = await UserTime.findOne({
        user_id: userId,
        date: today,
        tenant_id: tenantId
    });

    if (!record || !record.sessions || record.sessions.length === 0) {
        console.log("❌ No sessions found for today");
        return null;
    }

    // Find the most recent disconnect_time
    const lastDisconnect = record.sessions
        .filter(s => s.disconnect_time)
        .reduce((latest, session) => {
            return (!latest || session.disconnect_time > latest)
                ? session.disconnect_time
                : latest;
        }, null);

    if (!lastDisconnect) {
        console.log("⚠️ No disconnect_time found");
        return null;
    }

    console.log("⏳ Last Disconnect Time:", lastDisconnect);

    // Convert to Date object and check time difference
    const lastDisconnectDate = new Date(lastDisconnect);
    const now = new Date();
    const diffMs = now - lastDisconnectDate;
    const diffHours = diffMs / (1000 * 60 * 60);

    console.log(`🕒 Time difference: ${diffHours.toFixed(2)} hours`);

    // If difference is more than 1 hour, return it (eligible for deletion)
    if (diffHours > 1) {
        console.log("✅ More than 1 hour passed — eligible for deletion");
        return lastDisconnectDate;
    } else {
        console.log("⛔ Less than 1 hour — do not delete");
        return null;
    }
};

const handleUserSocketConnect = async (socket, io) => { 
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
        try { 
            const userId = socket.user.id || socket.user.user_id; 
            const today = getTodayDate(); // Changed to use getTodayDate() consistently
            const connectTime = new Date(); 
     
            console.log("Handling user socket connect for:", userId); 
     
            // Try to find existing record for today 
            let userTimeRecord = await UserTime.findOne({ 
                user_id: userId, 
                date: today,
                tenant_id: socket.user.tenant_id // Ensure tenant_id is also checked
            }); 
     
            if (userTimeRecord) { 
                // User already has a record for today 
                console.log(`User ${userId} reconnecting today. Adding new session.`); 
                 // ✅ Find the most recent disconnect_time
                // const recentDisconnect = userTimeRecord.sessions
                //     .filter(s => s.disconnect_time) // only ended sessions
                //     .reduce((latest, session) => {
                //         return (!latest || session.disconnect_time > latest)
                //             ? session.disconnect_time
                //             : latest;
                //     }, null);
const recentDisconnect = await getTodayLastDisconnectTime(userId, socket.user.tenant_id);

                // ✅ Check gap from recent disconnect to new connect
                if (recentDisconnect) {
                    const gap = connectTime - new Date(recentDisconnect);
                    if (process.env.NODE_ENV !== "development" && gap > 60 * 60 * 1000) { // > 1 hour
                        // deleteUserGeneratedImages(userId);
                        console.log('deleteddddddddddddddddddddddddddd');
                        // await AiTask.deleteMany({ user_id: userId });  
                        await AiTask.updateMany({ user_id: userId },{ $set: { in_session: false } });
                    }
                }
                // Optimize sessions before adding new one
                userTimeRecord.sessions = optimizeSessions(userTimeRecord.sessions);
                 
                // Add new session 
                userTimeRecord.sessions.push({ 
                    connect_time: connectTime, 
                    disconnect_time: null, 
                    duration: 0 
                }); 
                 
                userTimeRecord.is_currently_online = true; 
                userTimeRecord.last_activity = connectTime; 
                 
                await userTimeRecord.save(); 
            } else { 
                // Create new record for today 
                console.log(`Creating new daily record for user ${userId}`); 
                 
                userTimeRecord = new UserTime({ 
                    user_id: userId, 
                    tenant_id: socket.user.tenant_id,
                    date: today, 
                    total_time: 0, 
                    sessions: [{ 
                        connect_time: connectTime, 
                        disconnect_time: null, 
                        duration: 0 
                    }], 
                    is_currently_online: true, 
                    last_activity: connectTime 
                }); 
                 
                await userTimeRecord.save(); 
            } 
     
            // Store the session index for quick access during disconnect 
            socket.userTimeRecordId = userTimeRecord._id; 
            socket.currentSessionIndex = userTimeRecord.sessions.length - 1; 
            
            // If we reach here, the operation was successful
            break;
     
        } catch (error) { 
            if (error.name === 'VersionError' && retryCount < maxRetries - 1) {
                console.log(`Version conflict for user ${socket.user.id || socket.user.user_id}, retrying... (${retryCount + 1}/${maxRetries})`);
                retryCount++;
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
                continue;
            }
            
            console.error("Error handling user socket connect:", error);
            break;
        }
    }
}; 
 
const handleUserSocketDisconnect = async (socket) => { 
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
        try { 
            const userId = socket.user.id || socket.user.user_id; 
            const disconnectTime = new Date(); 
            const today = getTodayDate(); 
     
            console.log("Handling user socket disconnect for:", userId); 
     
            // Find today's record 
            const userTimeRecord = await UserTime.findOne({ 
                user_id: userId, 
                date: today,
                tenant_id: socket.user.tenant_id // Ensure tenant_id is also checked
            }); 
     
            if (!userTimeRecord) { 
                console.log(`No record found for user ${userId} on ${today}`); 
                return; 
            } 
     
            // Find the last active session (one without disconnect_time) 
            const activeSessionIndex = userTimeRecord.sessions.findIndex( 
                session => session.disconnect_time === null 
            ); 
     
            if (activeSessionIndex === -1) { 
                console.log(`No active session found for user ${userId}`); 
                return; 
            } 
     
            // Update the active session 
            const activeSession = userTimeRecord.sessions[activeSessionIndex]; 
            const sessionDuration = calculateSessionDuration(activeSession.connect_time, disconnectTime); 
     
            activeSession.disconnect_time = disconnectTime; 
            activeSession.duration = sessionDuration; 
     
            // Update total time for the day 
            userTimeRecord.total_time += sessionDuration; 
            userTimeRecord.is_currently_online = false; 
            userTimeRecord.last_activity = disconnectTime; 
            
            // Optimize sessions after disconnect
            userTimeRecord.sessions = optimizeSessions(userTimeRecord.sessions);
     
            await userTimeRecord.save(); 
     
            console.log(`User ${userId} session ended. Duration: ${Math.round(sessionDuration / 1000)} seconds`); 
            
            // If we reach here, the operation was successful
            break;
     
        } catch (error) { 
            if (error.name === 'VersionError' && retryCount < maxRetries - 1) {
                console.log(`Version conflict for user ${socket.user.id || socket.user.user_id}, retrying... (${retryCount + 1}/${maxRetries})`);
                retryCount++;
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
                continue;
            }
            
            console.error("Error handling user socket disconnect:", error);
            break;
        }
    }
};

async function handleUsageTimeStart(socket, data) {
    try {
        const user = socket.user;
        const { module, socketId } = data;
        
        // Get today's date (start of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        console.log(`Usage time start for user: ${user.id}, module: ${module}, socketId: ${socketId}`);
        
        // Find or create usage record for today
        let usageRecord = await UserModuleUsage.findOne({
            user_id: user.id,
            tenant_id: user.tenant_id,
            module: module,
            date: today
        });
        
        const currentTime = new Date();
        
        if (usageRecord) {
            // Check if socket_id already exists in sessions with a connect_time for today
            const existingSession = usageRecord.sessions.find(session => 
                session.socket_id === socketId && 
                session.connect_time.toDateString() === currentTime.toDateString()
            );
            
            if (existingSession) {
                console.log(`Socket ID ${socketId} already has a session for today. Ignoring.`);
                return;
            }
            
            // Add new session to existing record
            usageRecord.sessions.push({
                connect_time: currentTime,
                disconnect_time: null,
                socket_id: socketId,
                duration: 0
            });
            
            // Add socket_id to socket_ids array if not already present
            if (!usageRecord.socket_ids.includes(socketId)) {
                usageRecord.socket_ids.push(socketId);
            }
            
            usageRecord.last_activity = currentTime;
            await usageRecord.save();
            
            console.log(`Added new session to existing record for user ${user.id}`);
        } else {
            // Create new usage record
            usageRecord = new UserModuleUsage({
                user_id: user.id,
                tenant_id: user.tenant_id,
                date: today,
                module: module,
                socket_ids: [socketId],
                total_time: 0,
                sessions: [{
                    connect_time: currentTime,
                    disconnect_time: null,
                    socket_id: socketId,
                    duration: 0
                }],
                last_activity: currentTime
            });
            
            await usageRecord.save();
            console.log(`Created new usage record for user ${user.id}, module: ${module}`);
        }
        
    } catch (error) {
        console.error('Error handling usage-time-start:', error);
    }
}

/**
 * Handles the usage-time-end event
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} data - Event data containing module and socketId
 */
async function handleUsageTimeEnd(socket, data) {
    try {
        const user = socket.user;
        const { module, socketId } = data;
        
        // Get today's date (start of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        console.log(`Usage time end for user: ${user.id}, module: ${module}, socketId: ${socketId}`);
        
        // Find usage record for today
        const usageRecord = await UserModuleUsage.findOne({
            user_id: user.id,
            tenant_id: user.tenant_id,
            module: module,
            date: today
        });
        
        if (!usageRecord) {
            console.error(`No usage record found for user ${user.id}, module: ${module} for today`);
            return;
        }
        
        // Find the session with matching socket_id
        const sessionIndex = usageRecord.sessions.findIndex(session => 
            session.socket_id === socketId
        );
        
        if (sessionIndex === -1) {
            console.error(`No session found with socket_id: ${socketId} for user ${user.id}`);
            return;
        }
        
        const currentTime = new Date();
        const session = usageRecord.sessions[sessionIndex];
        
        // Update disconnect_time (override if already exists)
        session.disconnect_time = currentTime;
        
        // Calculate duration in milliseconds
        const duration = currentTime.getTime() - session.connect_time.getTime();
        session.duration = Math.max(0, duration); // Ensure non-negative duration
        
        // Update the session in the array
        usageRecord.sessions[sessionIndex] = session;
        
        // Calculate total_time by summing all session durations
        const totalTime = usageRecord.sessions.reduce((sum, sess) => {
            return sum + (sess.duration || 0);
        }, 0);
        
        usageRecord.total_time = totalTime;
        usageRecord.last_activity = currentTime;
        
        await usageRecord.save();
        
        console.log(`Updated session end time for user ${user.id}. Session duration: ${duration}ms, Total time: ${totalTime}ms`);
        
    } catch (error) {
        console.error('Error handling usage-time-end:', error);
    }
}
