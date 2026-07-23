export const responsiveFormLayout = {
    labelCol: { xs: { span: 24 }, md: { span: 6 } },
    wrapperCol: { xs: { span: 24 }, md: { span: 18 } },
};

export function getModalWidth(isMobile, desktopWidth = 520) {
    return isMobile ? "100%" : desktopWidth;
}

export const numericMobileInputProps = (isMobile) =>
    isMobile ? { type: "tel", inputMode: "numeric" } : {};
