export default function hasAnyPermission(
    permissions = [],
    allPermissions = {},
) {
    return permissions.some((permission) => {
        return allPermissions[permission] === true;
    });
}
