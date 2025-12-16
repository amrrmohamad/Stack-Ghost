export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        const role = req.user?.Roles?.role_name;
        if (!role || !allowedRoles.includes(role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }
        next();
    };
};
