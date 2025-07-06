'use client';

import React, { useEffect } from 'react';
import { Onborda, OnbordaProvider, useOnborda } from 'onborda';

interface OnboardingTourProps {
  isActive: boolean;
  onComplete: () => void;
}

const TourContent: React.FC<OnboardingTourProps> = ({ 
  isActive, 
  onComplete 
}) => {
  const { startOnborda } = useOnborda();

  useEffect(() => {
    if (isActive) {
      // Start the tour when component becomes active
      startOnborda('onboarding');
    }
  }, [isActive, startOnborda]);

  // Listen for tour completion
  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleComplete = () => {
      setTimeout(onComplete, 500);
    };

    // Add event listener for tour completion
    const observer = new MutationObserver(() => {
      const onbordaOverlay = document.querySelector('[data-onborda-overlay]');
      if (!onbordaOverlay && isActive) {
        handleComplete();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [isActive, onComplete]);

  return null;
};

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ 
  isActive, 
  onComplete 
}) => {
  const steps = [
    {
      tour: "onboarding",
      steps: [
        {
          icon: "👀",
          title: "Professional Context",
          content: "We discovered their background, current role, and expertise from their LinkedIn profile. This gives you natural conversation starters and connection points.",
          selector: "#professional-context",
          side: "right" as const,
          showControls: true,
          pointerPadding: 10,
          pointerRadius: 8,
        },
        {
          icon: "📈",
          title: "Communication History", 
          content: "Your connection history shows 12 emails over the past 8 months — your last interaction was 3 weeks ago. Perfect context for your next outreach.",
          selector: "#communication-history",
          side: "left" as const,
          showControls: true,
          pointerPadding: 10,
          pointerRadius: 8,
        },
        {
          icon: "🎁",
          title: "Suggested POGs",
          content: "Based on their interests and your expertise, here are 3 specific ways you could help them. Leading with generosity builds stronger relationships.",
          selector: "#suggested-pogs",
          side: "right" as const, 
          showControls: true,
          pointerPadding: 10,
          pointerRadius: 8,
        },
        {
          icon: "🎯",
          title: "Goal Alignment",
          content: "They could help with your specific professional goal because of their relevant experience in your target industry.",
          selector: "#goal-alignment",
          side: "left" as const,
          showControls: true,
          pointerPadding: 10,
          pointerRadius: 8,
        },
        {
          icon: "⏰",
          title: "Perfect Timing",
          content: "Ideal time to reach out: Now — they just posted about a topic that directly connects to your expertise area.",
          selector: "#timing-indicator",
          side: "right" as const,
          showControls: true,
          pointerPadding: 10,
          pointerRadius: 8,
        }
      ]
    }
  ];

  if (!isActive) {
    return null;
  }

  return (
    <OnbordaProvider>
      <Onborda
        steps={steps}
        showOnborda={false} // We'll control this with startOnborda hook
        shadowRgb="0,0,0"
        shadowOpacity="0.5"
      >
        <TourContent isActive={isActive} onComplete={onComplete} />
      </Onborda>
    </OnbordaProvider>
  );
}; 