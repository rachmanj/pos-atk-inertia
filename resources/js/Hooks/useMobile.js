import { useEffect, useState } from "react";

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";

function getIsMobile() {
    if (typeof window === "undefined") {
        return false;
    }

    return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

export default function useMobile() {
    const [isMobile, setIsMobile] = useState(getIsMobile);

    useEffect(() => {
        const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);

        const handleChange = () => {
            setIsMobile(mediaQuery.matches);
        };

        handleChange();
        mediaQuery.addEventListener("change", handleChange);
        window.addEventListener("resize", handleChange);

        return () => {
            mediaQuery.removeEventListener("change", handleChange);
            window.removeEventListener("resize", handleChange);
        };
    }, []);

    return isMobile;
}
