import { useEffect } from "react";
import { useLocation } from "react-router";

function PageScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        if (window.location.hash) {
            const element = document.querySelector(window.location.hash);
            if (element) {
            element.scrollIntoView();
            }
        } else {
            window.scrollTo(0, 0);
        }
    }, [pathname]);

   return null;
}

export default PageScrollToTop;