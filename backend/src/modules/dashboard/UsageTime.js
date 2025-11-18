import { UserModuleUsage } from "./userModuleUsageSchema";

/**
 * Handles the usage-time-start event
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} data - Event data containing module and socketId
 */
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

// Usage in your socket event handlers:
// socket.on("usage-time-start", (data) => {
//     handleUsageTimeStart(socket, data);
// });

// socket.on("usage-time-end", (data) => {
//     handleUsageTimeEnd(socket, data);
// });

export { handleUsageTimeStart, handleUsageTimeEnd };