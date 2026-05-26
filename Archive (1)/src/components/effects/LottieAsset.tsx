import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export function LottieAsset({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadAnimation = async () => {
      try {
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`Failed to load animation: ${src}`);
        }

        const data = await response.json();
        if (isActive) {
          setAnimationData(data);
        }
      } catch (error) {
        console.error(error);
        if (isActive) {
          setAnimationData(null);
        }
      }
    };

    loadAnimation();

    return () => {
      isActive = false;
    };
  }, [src]);

  if (!animationData) {
    return <div className={className} />;
  }

  return <Lottie animationData={animationData} loop autoplay className={className} />;
}
