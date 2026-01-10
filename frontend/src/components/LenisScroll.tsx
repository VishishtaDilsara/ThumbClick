import { useEffect } from "react";
import Lenis from "lenis";

let lenisInstance: Lenis | null = null;

export const getLenis = () => lenisInstance;

export default function LenisScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
      anchors: {
        offset: -100,
      },
    });

    lenisInstance = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  return null;
}
