'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  connected: boolean;
}

interface Connection {
  from: number;
  to: number;
  opacity: number;
}

interface NetworkFormationBackgroundProps {
  nodeCount?: number;
  maxConnections?: number;
  animationDuration?: number;
}

export const NetworkFormationBackground: React.FC<NetworkFormationBackgroundProps> = ({
  nodeCount = 25,
  maxConnections = 35,
  animationDuration = 4000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    setIsVisible(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize nodes
    const initializeNodes = () => {
      nodesRef.current = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * canvas.clientWidth,
        y: Math.random() * canvas.clientHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        connected: false,
      }));
    };

    initializeNodes();
    startTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      // Update node positions slightly
      nodesRef.current.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x <= 0 || node.x >= canvas.clientWidth) node.vx *= -1;
        if (node.y <= 0 || node.y >= canvas.clientHeight) node.vy *= -1;

        // Keep in bounds
        node.x = Math.max(0, Math.min(canvas.clientWidth, node.x));
        node.y = Math.max(0, Math.min(canvas.clientHeight, node.y));
      });

      // Gradually form connections based on progress
      if (progress < 1) {
        const targetConnections = Math.floor(progress * maxConnections);
        
        while (connectionsRef.current.length < targetConnections) {
          const from = Math.floor(Math.random() * nodeCount);
          const to = Math.floor(Math.random() * nodeCount);
          
          if (from !== to) {
            const distance = Math.sqrt(
              Math.pow(nodesRef.current[from].x - nodesRef.current[to].x, 2) +
              Math.pow(nodesRef.current[from].y - nodesRef.current[to].y, 2)
            );
            
            // Only connect if reasonably close
            if (distance < canvas.clientWidth * 0.3) {
              connectionsRef.current.push({
                from,
                to,
                opacity: 0,
              });
            }
          }
        }

        // Fade in connections
        connectionsRef.current.forEach(connection => {
          connection.opacity = Math.min(connection.opacity + 0.02, 0.3);
        });
      }

      // Draw connections
      connectionsRef.current.forEach(connection => {
        const fromNode = nodesRef.current[connection.from];
        const toNode = nodesRef.current[connection.to];
        
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle = `rgba(33, 150, 243, ${connection.opacity * 0.15})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw nodes
      nodesRef.current.forEach((node, index) => {
        const nodeOpacity = Math.min(progress * 2, 1);
        const radius = connectionsRef.current.some(c => c.from === index || c.to === index) ? 3 : 2;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(33, 150, 243, ${nodeOpacity * 0.2})`;
        ctx.fill();
        
        // Highlight connected nodes
        if (connectionsRef.current.some(c => c.from === index || c.to === index)) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 1, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(33, 150, 243, ${nodeOpacity * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodeCount, maxConnections, animationDuration]);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        opacity: isVisible ? 0.5 : 0,
        transition: 'opacity 1.5s ease-in-out',
        pointerEvents: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </Box>
  );
}; 