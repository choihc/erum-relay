declare module 'lottie-react' {
  import { ComponentType } from 'react';

  interface LottieProps {
    animationData: unknown;
    loop?: boolean;
    autoplay?: boolean;
    style?: React.CSSProperties;
    onLoadedImages?: () => void;
    onError?: (error: Error) => void;
    lottieRef?: React.RefObject<{
      setSpeed: (speed: number) => void;
    } | null>;
    rendererSettings?: {
      preserveAspectRatio?: string;
    };
  }

  const Lottie: ComponentType<LottieProps>;
  export default Lottie;
}

declare module '*.lottie' {
  const content: unknown;
  export default content;
}

declare module '*.json' {
  const content: unknown;
  export default content;
}
