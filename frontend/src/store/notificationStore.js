// import { create } from "zustand";

// export const useNotificationStore = create((set) => ({
//   notifications: [],

//   setNotifications: (newNotifications) => set(() => ({
//     notifications: newNotifications,
//   })),

//   markAllAsRead: () => set((state) => ({
//     notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
//   })),
// }));




import { create } from "zustand";

export const useNotificationStore = create((set) => ({
  notifications: [],
  
  setNotifications: (newNotifications) => 
    set(state => ({
      notifications: typeof newNotifications === 'function' 
        ? newNotifications(state.notifications) 
        : newNotifications
    })), 
    
  markAllAsRead: () => 
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true }))
    })),

  markSingledNotificationAsRead: (id) =>
    set(state => {    

      const updatedNotifications = state.notifications.map(n =>
        (n.id === id) || (n._id === id) ? { ...n, isRead: true } : n
      );
    
      return { notifications: updatedNotifications };
  }),
  markSingledNotificationAsUnread: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        (notification.id || notification._id) === notificationId
          ? { ...notification, isRead: false }
          : notification
      ),
    }));
  },
}));

