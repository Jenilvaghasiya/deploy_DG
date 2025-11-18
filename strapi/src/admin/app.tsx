import type { StrapiApp } from '@strapi/strapi/admin';
import './app.css';
import favicon from './extensions/favicon.png';
import { FaUsersGear } from 'react-icons/fa6';
import CreditManagement from './pages/CreditManagement';
import TenantManagement from './pages/TenantManagement';
import UserManagement from './pages/User Management/UserManagement';
import SubscriptionManagement from './pages/Subscription_Management/SubscriptionManagement';
import SocialPostManagement from './pages/Social Management/SocialPostManagement';
import { FaCreditCard, FaUsers, FaRunning } from 'react-icons/fa';
import { FaStripeS } from "react-icons/fa";
import { BsFilePost } from "react-icons/bs";
import { GrAnnounce } from "react-icons/gr"
import { TbRating18Plus } from "react-icons/tb";
import ActivityLog from './pages/ActivityLog';
import { BsChatLeftQuote } from "react-icons/bs";
import PlatformAnnouncements from './pages/Platform_Announcement/PlatformAnnouncements';
import AppReviewManagement from './pages/App_Review_Management/AppReviewManagement';
import NSFW_Setting from './pages/NSFW_Settings/NSFW_Setting';
export default {
  config: {
    locales: ['en'],
    head: {
      title: 'Design Genie Admin',
      favicon : favicon, // optional
    },
    translations: {
      en: {
        "Auth.form.welcome.title": "Welcome to Design Genie",
        "Auth.form.welcome.subtitle": "Log in to manage your content",
        "Auth.form.email.label": "Email Address",
        "Auth.form.password.label": "Password",
        "Auth.form.button.login": "Log In",
        "Auth.link.forgot-password": "Forgot your password?",
        "Auth.form.register.news.label": "Send me product updates",
      },
    },
    theme: {
      dark: {
        colors: {
          buttonPrimary500: '#d385b8', // purple-600
        buttonPrimary600: '#9333ea',
        },
      },
    },
  },
  bootstrap(app: StrapiApp) {
    const titleEl = document.querySelector('title');
    if (titleEl) {
      titleEl.innerText = 'Design Genie Admin';
    } else {
      const newTitle = document.createElement('title');
      newTitle.innerText = 'Design Genie Admin';
      document.head.appendChild(newTitle);
    }

    // Register Credit Management page
    app.addMenuLink({
      to: '/credit-management',
      icon: () => <span style={{fontWeight: 'bold'}}><FaCreditCard size={18} /></span>,
      intlLabel: {
        id: 'credit-management.label',
        defaultMessage: 'Credit Management',
      },
      Component: async () => {
        return CreditManagement;
      },
      permissions: [
        // Only super admin by default; adjust as needed
        { action: 'admin::marketplace.read', subject: null },
      ],
      exact: true,
    });

    app.addMenuLink({
      to: '/tenant-management',
      icon: () => <span style={{fontWeight: 'bold'}}><FaUsers size={18} /></span>,
      intlLabel: {
        id: 'tenant-management.label',
        defaultMessage: 'Tenant Management',
      },
      Component: async () => {
        return TenantManagement;
      },
      permissions: [
        // Only super admin by default; adjust as needed
        { action: 'admin::marketplace.read', subject: null },
      ],
      exact: true,
    });

    app.addMenuLink({
      to: '/social-management',
      icon: () => <span style={{fontWeight: 'bold'}}><BsFilePost size={18}/></span>,
      intlLabel: {
        id: 'social-post-management.label',
        defaultMessage: 'Social Post Management',
      },
      Component: async () => {
        return SocialPostManagement;
      },
      permissions: [
        // Only super admin by default; adjust as needed
        { action: 'admin::marketplace.read', subject: null },
      ],
      exact: true,
    });


    
    app.addMenuLink({
      to: '/app-review-management',
      icon: () => <span style={{fontWeight: 'bold'}}><BsChatLeftQuote size={18}/></span>,
      intlLabel: {
        id: 'social-post-management.label',
        defaultMessage: 'App Review Management',
      },
      Component: async () => {
        return AppReviewManagement;
      },
      permissions: [
        // Only super admin by default; adjust as needed
        { action: 'admin::marketplace.read', subject: null },
      ],
      exact: true,
    });

    app.addMenuLink({
      to: '/subscription-management',
      icon: () => <span style={{fontWeight: 'bold'}}><FaStripeS size={18}/></span>,
      intlLabel: {
        id: 'subscription-management.label',
        defaultMessage: 'Subscription Management',
      },
      Component: async () => {
        return SubscriptionManagement;
      },
      permissions: [
        // Only super admin by default; adjust as needed
        { action: 'admin::marketplace.read', subject: null },
      ],
      exact: true,
    });

    app.addMenuLink({
      to: '/activity-log',
      icon: () => <span style={{fontWeight: 'bold'}}><FaRunning size={18} /></span>,
      intlLabel: {
        id: 'activity-log.label',
        defaultMessage: 'Activity Log',
      },
      Component: async () => {
        return ActivityLog;
      },
      permissions: [
        // Only super admin by default; adjust as needed
        { action: 'admin::marketplace.read', subject: null },
      ],
      exact: true,
    });

    app.addMenuLink({
      to: '/platform-announcements',
      icon: () => <span style={{fontWeight: 'bold'}}><GrAnnounce size={18}/></span>,
      intlLabel: {
        id: 'platform-announcements.label',
        defaultMessage: 'Platform Announcements',
      },
      Component: async () => {
        return PlatformAnnouncements;
      },
      permissions: [
        // Only super admin by default; adjust as needed
        { action: 'admin::marketplace.read', subject: null },
      ],
      exact: true,
    });

    app.addMenuLink({
      to: '/user-management',
      icon: () => <span style={{fontWeight: 'bold'}}><FaUsersGear size={18}/></span>,
      intlLabel: {
        id: 'user-management.label',
        defaultMessage: 'User Management',
      },
      Component: async () => {
        return UserManagement;
      },
      permissions: [
        // Only super admin by default; adjust as needed
        { action: 'admin::marketplace.read', subject: null },
      ],
      exact: true,
    });
    app.addMenuLink({
      to: '/nsfw-setting',
      icon: () => <span style={{fontWeight: 'bold'}}><TbRating18Plus size={20}/></span>,
      intlLabel: {
        id: 'nsfw-setting.label',
        defaultMessage: 'NSFW Setting',
      },
      Component: async () => {
        return NSFW_Setting;
      },
      permissions: [
        // Only super admin by default; adjust as needed
        { action: 'admin::marketplace.read', subject: null },
      ],
      exact: true,
    });
  },
};
