/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { PinData } from '@/lib/supabase';
import { ROLE_CONFIGS, DiscordRole } from '@/config/riglob';

interface GlobeSceneProps {
  pins: PinData[];
  selectedPin: PinData | null;
  onSelectPin: (pin: PinData | null) => void;
  onHoverPin: (hoverData: { pin: PinData; x: number; y: number } | null) => void;
}

export default function GlobeScene({ pins, selectedPin, onSelectPin, onHoverPin }: GlobeSceneProps) {
  const globeRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Focus on selected pin with animation
  useEffect(() => {
    if (!globeRef.current || !selectedPin) return;

    const globe = globeRef.current;
    const controls = globe.controls();

    if (controls) {
      controls.autoRotate = false;
    }

    // Fly to the coordinates of the selected pin
    globe.pointOfView({
      lat: selectedPin.latitude,
      lng: selectedPin.longitude,
      altitude: 1.6, // Zoomed-in preview altitude
    }, 1500);
  }, [selectedPin]);

  // Handle window resizing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial size
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Configure Auto-rotation and Controls
  useEffect(() => {
    if (!globeRef.current) return;

    const globe = globeRef.current;
    const controls = globe.controls();

    // Configure OrbitControls
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4; // Slow rotation
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 150; // Zoom limits
    controls.maxDistance = 500;

    // Pause auto-rotation on user drag, resume after 5 seconds of inactivity
    let resumeTimeout: NodeJS.Timeout;

    const handleStart = () => {
      controls.autoRotate = false;
      clearTimeout(resumeTimeout);
    };

    const handleEnd = () => {
      resumeTimeout = setTimeout(() => {
        if (controls) {
          controls.autoRotate = true;
        }
      }, 5000);
    };

    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);

    // Initial camera position
    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0);

    return () => {
      if (controls) {
        controls.removeEventListener('start', handleStart);
        controls.removeEventListener('end', handleEnd);
      }
      clearTimeout(resumeTimeout);
    };
  }, []);

  // Custom HTML Pin Generator
  const createMarkerElement = (pin: PinData) => {
    const el = document.createElement('div');
    const roleStyle = ROLE_CONFIGS[pin.role as DiscordRole] || ROLE_CONFIGS['None'];

    el.className = `custom-globe-marker ${roleStyle.markerClass}`;
    el.style.color = roleStyle.color;
    el.style.borderColor = roleStyle.color;
    el.style.boxShadow = `0 0 12px ${roleStyle.glowColor}, inset 0 0 6px ${roleStyle.glowColor}`;

    // Avatar image inside the marker
    const img = document.createElement('img');
    img.src = pin.profile_image_url || 'https://via.placeholder.com/80/121214/00ff66?text=R';
    img.alt = pin.name;
    img.className = 'custom-globe-marker-avatar';

    // Fallback image in case of loading error
    img.onerror = () => {
      img.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(pin.wallet_address)}`;
    };

    el.appendChild(img);

    // Dynamic name indicator above marker
    const nameLabel = document.createElement('div');
    nameLabel.innerText = pin.name;
    nameLabel.style.position = 'absolute';
    nameLabel.style.top = '-20px';
    nameLabel.style.whiteSpace = 'nowrap';
    nameLabel.style.fontSize = '9px';
    nameLabel.style.fontWeight = 'bold';
    nameLabel.style.fontFamily = 'monospace';
    nameLabel.style.color = '#fff';
    nameLabel.style.textShadow = '0 1px 4px rgba(0, 0, 0, 0.9), 0 0 4px #000';
    nameLabel.style.opacity = '0.7';
    el.appendChild(nameLabel);

    // Glowing outer pulse ring
    const pulse = document.createElement('div');
    pulse.className = 'custom-globe-marker-pulse';
    el.appendChild(pulse);

    // Hover Events
    el.onmouseenter = (e) => {
      onHoverPin({ pin, x: e.clientX, y: e.clientY });
      nameLabel.style.opacity = '1';
    };

    el.onmouseleave = () => {
      onHoverPin(null);
      nameLabel.style.opacity = '0.7';
    };

    el.onmousemove = (e) => {
      onHoverPin({ pin, x: e.clientX, y: e.clientY });
    };

    // Click Event
    el.onclick = (e) => {
      e.stopPropagation();
      onSelectPin(pin);
    };

    return el;
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing"
      onClick={() => onSelectPin(null)}
    >
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)" // Transparent to reveal cyber-grid and stars behind

        // Earth Textures & Styles
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        showAtmosphere={true}
        atmosphereColor="#00ff66"
        atmosphereAltitude={0.15}
        onGlobeClick={() => onSelectPin(null)}

        // Grid Lines
        showGraticules={true}

        // Custom HTML Marker Setup
        htmlElementsData={pins}
        htmlLat={(d: any) => d.latitude}
        htmlLng={(d: any) => d.longitude}
        htmlElement={(d: any) => createMarkerElement(d as PinData)}
        htmlTransitionDuration={1000}
      />
    </div>
  );
}
