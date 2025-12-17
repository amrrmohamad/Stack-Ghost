import prisma from '../lib/prisma.js';

/**
 * checkPermission middleware
 */
const checkPermission = (permissionName) => {
    return async (req, res, next) => {
        try {
            if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

            const role = await prisma.roles.findUnique({
                where: { role_id: req.user.role_id },
                include: {
                    Role_Permissions: {
                        include: { Permissions: true }
                    }
                }
            });

            const permissions = role.Role_Permissions.map(rp => rp.Permissions.permission_name);

            if (!permissions.includes(permissionName)) {
                return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
            }

            next();
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    };
};

export default checkPermission;
