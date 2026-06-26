const roleLabels = {
    admin: "Admin",
    cashier: "Kasir",
};

export const getRoleLabel = (roleName) => {
    if (!roleName) {
        return "-";
    }

    if (roleLabels[roleName]) {
        return roleLabels[roleName];
    }

    return roleName
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
};

export default getRoleLabel;
