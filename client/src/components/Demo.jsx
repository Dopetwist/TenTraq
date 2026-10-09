import { useEffect, useRef } from "react";
import { revealBottom } from "../utils/reveal";

function Demo() {

    const videoRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;

        if (!video) return;

        video.muted = true;
        video.playsInline = true;

        const playVideo = async () => {
            try {
                await video.play();
            } catch (error) {
                console.log("Autoplay blocked:", error);
            }
        };

        playVideo();
    }, []);

    useEffect(() => {
        revealBottom("#demo-container");
    }, []);

    return (
        <div id="demo-container">
            <video
            ref={videoRef}
            className="demo-video"
            autoPlay 
            muted 
            loop
            playsInline
            preload="auto"
            >
                <source
                    src="/TenTraq_Demo.mp4"
                    type="video/mp4"
                />
            </video>
        </div>
    );
}

export default Demo;