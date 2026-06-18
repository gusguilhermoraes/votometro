import Splashscreen from "./splash";
import Welcome from "./welcome";
import React, { useEffect, useState } from "react";

export default function App() {
    const [isShowSplash, setIsShowSplash] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setIsShowSplash(false);
        }, 2000);
    }, []);
  return <>{isShowSplash ? <Splashscreen /> : <Welcome />}</>;
}
