import { useEffect, useState } from "react";

export function LoadingIndicator() {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDots((dots) => (dots.length < 3 ? dots + "." : "."));
    }, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return <div>Loading{dots}</div>;
}
