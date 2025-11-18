import Role from "../modules/roles/model.js";
import { ApiError } from "../utils/ApiError.js";

export const hasPermission = (requiredKey) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user || !user.role_id) {
                throw new ApiError(401, "Unauthorized");
            }


            const role = await Role.findOne({
                _id: user.role_id,
                is_deleted: false,
                is_active: true,
            }).populate({
                path: "permissions",
                match: { is_deleted: false, is_active: true },
                select: "key",
            });


            const permissionKeys =
                role?.permissions?.map((perm) => perm.key) || [];

            if (!permissionKeys.includes(requiredKey)) {
                throw new ApiError(403, "Forbidden: Missing permission");
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};
