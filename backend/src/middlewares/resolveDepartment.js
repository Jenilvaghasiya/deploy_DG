import Department from "../modules/departments/model.js";

export const resolveDepartment = async (req, res, next) => {
    const { department } = req.body;

    const tenantId = req.user?.tenant_id || req.body.tenant_id;

    if (!tenantId) {
        return res
            .status(400)
            .json({ message: "Missing tenant_id for department resolution" });
    }

    try {
        if (typeof department === "string" && department.trim()) {
            // Handle plain string input (manual input)
            let found = await Department.findOne({
                name: department.trim(),
                tenant_id: tenantId,
                is_deleted: false,
            });

            if (!found) {
                found = await Department.create({
                    name: department.trim(),
                    tenant_id: tenantId,
                });
            }

            req.body.department_id = found._id;
        } else if (
            typeof department === "object" &&
            department?.label &&
            !department?.value // new department object
        ) {
            let found = await Department.findOne({
                name: department.label.trim(),
                tenant_id: tenantId,
                is_deleted: false,
            });

            if (!found) {
                found = await Department.create({
                    name: department.label.trim(),
                    tenant_id: tenantId,
                });
            }

            req.body.department_id = found._id;
        } else if (department?.value) {
            // Existing department selected
            req.body.department_id = department.value;
        }

        // Important: Don't delete the original department object from the request
        // This enables the client to keep structure when editing
        // Just add the department_id alongside it

        next();
    } catch (err) {
        console.error("Department resolution failed:", err);
        return res.status(500).json({ message: "Department resolution error" });
    }
};

// import Department from "../modules/departments/model.js";

// export const resolveDepartment = async (req, res, next) => {
//     const { department } = req.body;

//     const tenantId = req.user?.tenant_id || req.body.tenant_id;

//     if (!tenantId) {
//         return res
//             .status(400)
//             .json({ message: "Missing tenant_id for department resolution" });
//     }

//     try {
//         if (typeof department === "string" && department.trim()) {
//             // Handle plain string input (manual input)
//             let found = await Department.findOne({
//                 name: department.trim(),
//                 tenant_id: tenantId,
//                 is_deleted: false,
//             });

//             if (!found) {
//                 found = await Department.create({
//                     name: department.trim(),
//                     tenant_id: tenantId,
//                 });
//             }

//             req.body.department_id = found._id;
//         } else if (
//             typeof department === "object" &&
//             department?.label &&
//             !department?.value // new department object
//         ) {
//             let found = await Department.findOne({
//                 name: department.label.trim(),
//                 tenant_id: tenantId,
//                 is_deleted: false,
//             });

//             if (!found) {
//                 found = await Department.create({
//                     name: department.label.trim(),
//                     tenant_id: tenantId,
//                 });
//             }

//             req.body.department_id = found._id;
//         } else if (department?.value) {
//             // Existing department selected
//             req.body.department_id = department.value;
//         }

//         delete req.body.department;
//         next();
//     } catch (err) {
//         console.error("Department resolution failed:", err);
//         return res.status(500).json({ message: "Department resolution error" });
//     }
// };

// import Department from "../modules/departments/model.js";

// export const resolveDepartment = async (req, res, next) => {
//     const { department } = req.body;

//     const tenantId = req.user?.tenant_id || req.body.tenant_id;

//     if (!tenantId) {
//         return res
//             .status(400)
//             .json({ message: "Missing tenant_id for department resolution" });
//     }

//     if (typeof department === "string") {
//         let found = await Department.findOne({
//             name: department.trim(),
//             tenant_id: tenantId,
//             is_deleted: false,
//         });

//         if (!found) {
//             found = await Department.create({
//                 name: department.trim(),
//                 tenant_id: tenantId,
//             });
//         }

//         req.body.department_id = found._id;
//     } else if (department?.id) {
//         req.body.department_id = department.id;
//     }

//     delete req.body.department;
//     next();
// };
