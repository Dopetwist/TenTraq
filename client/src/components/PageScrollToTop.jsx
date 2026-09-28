import { useEffect } from "react";
import { useLocation } from "react-router";

function PageScrollToTop() {
    const { hash, key } = useLocation();

    useEffect(() => {
        if (hash) {
            const element = document.querySelector(hash);
            if (element) {
                element.scrollIntoView();
                return;
            }
        }

        window.scrollTo(0, 0);
        document.querySelectorAll(".app-content").forEach((scrollContainer) => {
            scrollContainer.scrollTop = 0;
        });
    }, [hash, key]);

    return null;
}

export default PageScrollToTop;