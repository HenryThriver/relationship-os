export interface AnimationSequenceConfig {
  duration: number;
  delay?: number;
  easing?: string;
}

export const animateIn = (
  element: React.RefObject<HTMLElement | null>, 
  config: AnimationSequenceConfig = { duration: 800 }
): Promise<void> => {
  return new Promise((resolve) => {
    if (!element.current) return resolve();
    
    const { duration, delay = 0, easing = 'cubic-bezier(0.4, 0, 0.2, 1)' } = config;
    
    // Set initial state
    element.current.style.opacity = '0';
    element.current.style.transform = 'translateY(20px)';
    element.current.style.transition = `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`;
    
    setTimeout(() => {
      if (element.current) {
        element.current.style.opacity = '1';
        element.current.style.transform = 'translateY(0)';
        
        setTimeout(() => resolve(), duration);
      }
    }, delay);
  });
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const staggeredAnimation = async (
  elements: React.RefObject<HTMLElement | null>[],
  staggerDelay: number = 200,
  animationConfig: AnimationSequenceConfig = { duration: 600 }
): Promise<void> => {
  const promises = elements.map((element, index) => 
    animateIn(element, {
      ...animationConfig,
      delay: index * staggerDelay
    })
  );
  
  await Promise.all(promises);
}; 