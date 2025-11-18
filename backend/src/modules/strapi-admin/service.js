// services/userStrapiService.js
import User from "../../modules/users/model.js";
import Tenant from "../../modules/tenants/model.js";
import UserCredits from "../../modules/credits/model.js";
import StarpiUsageLog from "./starpiUsageLogSchema.js";
import TenantCredits from "../../modules/credits/tenantCreditSchema.js";
import Notification from "../notifications/model.js";

// export const getUsersWithCredits = async ({ search = "", page = 1, limit = 10 }) => {
//   const query = { is_deleted: false };

//   if (search) {
//     query.full_name = { $regex: search, $options: "i" };
//   }

//   const skip = (parseInt(page) - 1) * parseInt(limit);

//   const users = await User.find(query)
//     .populate("role_id")
//     .skip(skip)
//     .limit(parseInt(limit))
//     .lean();

//   const userIds = users.map((user) => user._id);

//   const userCredits = await UserCredits.find({ user_id: { $in: userIds } }).lean();

//   const creditMap = new Map(userCredits.map((uc) => [uc.user_id.toString(), uc]));

//   const mergedUsers = users
//     .map((user) => {
//       const credits = creditMap.get(user._id.toString());
//       if (!credits) return null;
//       return {
//         ...user,
//         credits,
//       };
//     })
//     .filter(Boolean); // Remove null entries

//   return mergedUsers;
// };


// export const addCredits = async (user_id, creditsToAdd) => {
//   const userCredit = await UserCredits.findOne({ user_id });

//   if (!userCredit) {
//     throw new Error("UserCredits not found for given user_id");
//   }

//   userCredit.credits += creditsToAdd;
//   await userCredit.save();

//   return userCredit.toJSON();
// };

// export const getAllTenants = (
//   search, 
//   page = 1, 
//   limit = 10, 
//   startDate, 
//   endDate,
//   startUpdateDate,
//   endUpdateDate
// ) => {
//   const query = {
//     is_deleted: false,
//     is_active: true,
//   };

//   if (search) {
//     query.name = { $regex: search, $options: "i" };
//   }

//   if (startDate && endDate) {
//     query.member_since = {
//       $gte: new Date(startDate),
//       $lte: new Date(endDate),
//     };
//   } else if (startDate) {
//     query.member_since = { $gte: new Date(startDate) };
//   } else if (endDate) {
//     query.member_since = { $lte: new Date(endDate) };
//   }

//   const skip = (page - 1) * limit;

//   return Tenant.find(query)
//     .sort({ member_since: -1 }) // recent first
//     .skip(skip)
//     .limit(limit);
// };

export const getTenantsWithCredits = async ({ search = "", page = 1, limit = 10 }) => {
  const query = { is_deleted: false };

  if (search) {
    query.full_name = { $regex: search, $options: "i" };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const tenants = await Tenant.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const tenantIds = tenants.map((tenant) => tenant._id);

  const tenantCredits = await TenantCredits.find({ tenant_id: { $in: tenantIds } }).lean();

  const creditMap = new Map(tenantCredits.map((uc) => [uc.tenant_id.toString(), uc]));

  const mergedTenants = tenants
    .map((tenant) => {
      const credits = creditMap.get(tenant._id.toString());
      if (!credits) return null;
      return {
        ...tenant,
        credits,
      };
    })
    .filter(Boolean); // Remove null entries

  return mergedTenants;
};


export const addCredits = async (tenant_id, creditsToAdd) => {
  const tenantCredit = await TenantCredits.findOne({ tenant_id });

  if (!tenantCredit) {
    throw new Error("TeanantCredits not found for given tenant_id");
  }

  tenantCredit.credits += creditsToAdd;
  await tenantCredit.save();

  return tenantCredit.toJSON();
};

export const getAllTenants = (
  search, 
  page = 1, 
  limit = 10, 
  startDate, 
  endDate,
  startUpdateDate,
  endUpdateDate
) => {
  const query = {
    is_deleted: false,
    is_active: true,
  };

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  if (startDate && endDate) {
    query.member_since = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    query.member_since = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.member_since = { $lte: new Date(endDate) };
  }

  const skip = (page - 1) * limit;

  return Tenant.find(query)
    .sort({ member_since: -1 }) // recent first
    .skip(skip)
    .limit(limit);
};

export const getAllUsers = (
  search,
  page = 1,
  limit = 10,
  startDate,
  endDate
) => {
  console.log(page, limit);
  
  const query = {
    is_deleted: false,
    is_active: true,
  };

  if (search) {
  query.$or = [
    { full_name: { $regex: search, $options: "i" } },
    { email: { $regex: search, $options: "i" } },
  ];
}

  if (startDate && endDate) {
    query.member_since = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    query.member_since = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.member_since = { $lte: new Date(endDate) };
  }


  const skip = (page - 1) * limit;
  console.log(page, limit);

  return User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export const countUsers = (search, startDate, endDate) => {
  const query = {
    is_deleted: false,
    is_active: true,
  };

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  if (startDate && endDate) {
    query.member_since = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    query.member_since = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.member_since = { $lte: new Date(endDate) };
  }

  return User.countDocuments(query);
};


// Count tenants for pagination
export const countTenants = (
  search, 
  startDate, 
  endDate
) => {
  const query = {
    is_deleted: false,
    is_active: true,
  };

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  if (startDate && endDate) {
    query.member_since = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    query.member_since = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.member_since = { $lte: new Date(endDate) };
  }

  return Tenant.countDocuments(query);
};

 
export const getUserById = async (id) => {
    const user = await User.findOne({ _id: id, is_deleted: false }).populate(
        "role_id",
    );
    if (!user) throw new Error("User not found");
    return user;
}

export const getAllActivity = (
  search, 
  page = 1, 
  limit = 10, 
  startDate, 
  endDate,
  startUpdateDate,
  endUpdateDate
) => {

  const query = {};

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    query.createdAt = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.createdAt = { $lte: new Date(endDate) };
  }

  const skip = (page - 1) * limit;

  return StarpiUsageLog.find(query)
    // .sort({ member_since: -1 }) // recent first
    .skip(skip)
    .limit(limit);
};

// Count activity for pagination
export const countActivity = (
  search, 
  startDate, 
  endDate
) => {

  const query = {};

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    query.createdAt = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.createdAt = { $lte: new Date(endDate) };
  }

  return StarpiUsageLog.countDocuments(query);
};

// Service
export const getPlatformNotifications = async ({
  search = "",
  page = 1,
  limit = 10,
  type,
  startDate,
  endDate,
}) => {
  const query = {};

  if (type) {
    query.type = type;
  }

  if (search) {
    query.message = { $regex: search, $options: "i" };
  }

  if (startDate && endDate) {
    query.created_at = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    query.created_at = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.created_at = { $lte: new Date(endDate) };
  }

  const skip = (page - 1) * limit;

  return Notification.find(query)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .populate("user_id", "full_name email");
};

// Count notifications for pagination
export const countPlatformNotifications = (search, type, startDate, endDate) => {
  const query = {};

  if (type) {
    query.type = type;
  }

  if (search) {
    query.message = { $regex: search, $options: "i" };
  }

  if (startDate && endDate) {
    query.created_at = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    query.created_at = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.created_at = { $lte: new Date(endDate) };
  }

  return Notification.countDocuments(query);
};

