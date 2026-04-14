import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function Timer({ seconds }) {
  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Clock size={24} color="#007aff" /> {formatTime(seconds)}
    </h2>
  );
}
