import React from 'react';

/**
 * Global cinematic background: black-to-teal gradient + film grain (no accent lines).
 */
export const CinematicBackground: React.FC = () => (
  <div
    className="fixed inset-0 pointer-events-none zaxion-cinematic-bg zaxion-grain"
    aria-hidden
  />
);
