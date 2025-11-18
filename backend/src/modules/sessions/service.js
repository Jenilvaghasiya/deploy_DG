import Session from './model.js';

export const createSession = async (userId) => {
    try {
        const session = new Session({
            userId,
            loginTime: new Date(),
        });
        await session.save();
        return session;
    } catch (error) {
        throw new Error(`Error creating session: ${error.message}`);
    }
};

export const updateSessionLogoutTime = async (sessionId) => {
    try {
        const session = await Session.findByIdAndUpdate(
            sessionId,
            { logoutTime: new Date() },
            { new: true }
        );
        if (!session) {
            throw new Error('Session not found.');
        }
        return session;
    } catch (error) {
        throw new Error(`Error updating session logout time: ${error.message}`);
    }
};

// export const createSession = async (userId, keepMeLoggedIn = false, sessionTimeout = null) => {
//   // Determine session timeout
//   const logInTime = new Date()
//   const expiresAt = new Date(Date.now() + sessionTimeout * 60 * 1000);

//   // Create session
//   const session = await Session.create({
//     loginTime: logInTime,
//     userId,
//     expiresAt,
//     keepMeLoggedIn,
//   });

//   return session;
// };