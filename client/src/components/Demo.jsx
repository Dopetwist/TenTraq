import { useEffect } from "react";
import { revealBottom } from "../utils/reveal";

function Demo() {

    useEffect(() => {
        revealBottom("#demo-container");
    }, []);

    return (
        <div id="demo-container">
            <video 
            className="demo-video" 
            src="/TenTraq_Demo.mp4" 
            autoPlay 
            muted 
            loop
            >
            </video>
        </div>
    );
}

export default Demo;