'use client';

import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Trip } from '@/types';
import { latLngToVector3, getArcMidpoint } from '@/lib/geo';

interface GlobeProps {
  trips: Trip[];
  selectedTripId: string | null;
  onSelectTrip: (id: string | null) => void;
}

// Earth with realistic appearance
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create a more realistic earth using gradients and patterns
  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Ocean gradient
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGradient.addColorStop(0, '#0c4a6e');
    oceanGradient.addColorStop(0.5, '#164e63');
    oceanGradient.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, 1024, 512);
    
    // Add some noise for texture
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const alpha = Math.random() * 0.1;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(x, y, 1, 1);
    }
    
    // Simplified continent shapes (rough approximations)
    ctx.fillStyle = '#166534';
    ctx.globalAlpha = 0.6;
    
    // North America
    ctx.beginPath();
    ctx.ellipse(200, 150, 80, 60, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // South America
    ctx.beginPath();
    ctx.ellipse(280, 320, 40, 80, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Europe/Africa
    ctx.beginPath();
    ctx.ellipse(520, 200, 50, 100, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Asia
    ctx.beginPath();
    ctx.ellipse(700, 150, 120, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Australia
    ctx.beginPath();
    ctx.ellipse(820, 340, 40, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1;
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  return (
    <group>
      {/* Main Earth sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Atmosphere glow - inner */}
      <mesh scale={[1.02, 1.02, 1.02]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Atmosphere glow - outer */}
      <mesh scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Atmosphere glow - far */}
      <mesh scale={[1.25, 1.25, 1.25]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#1d4ed8"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// Auto-rotation controller
function AutoRotate({ enabled }: { enabled: boolean }) {
  const { camera } = useThree();
  const angleRef = useRef(0);
  
  useFrame((_, delta) => {
    if (enabled) {
      angleRef.current += delta * 0.08;
      const radius = camera.position.length();
      camera.position.x = Math.sin(angleRef.current) * radius * 0.8;
      camera.position.z = Math.cos(angleRef.current) * radius;
      camera.lookAt(0, 0, 0);
    }
  });
  
  return null;
}

interface TripArcProps {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  color: string;
  isSelected: boolean;
  isPast: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
  isHovered: boolean;
  animationOffset: number;
}

function TripArc({ from, to, color, isSelected, isPast, onClick, onHover, isHovered, animationOffset }: TripArcProps) {
  const lineRef = useRef<THREE.Line>(null);
  
  const { curve, points } = useMemo(() => {
    const start = latLngToVector3(from.lat, from.lng);
    const end = latLngToVector3(to.lat, to.lng);
    const mid = getArcMidpoint(from, to);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(50);
    return { curve, points };
  }, [from, to]);

  // Determine visual state
  const opacity = isPast ? 0.25 : isSelected || isHovered ? 1 : 0.6;
  const lineColor = isHovered ? '#fbbf24' : color;

  return (
    <line
      ref={lineRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={lineColor}
        linewidth={2}
        opacity={opacity}
        transparent
      />
    </line>
  );
}

interface CityMarkerProps {
  city: { id: string; name: string; lat: number; lng: number; arriveDate: string };
  color: string;
  isSelected: boolean;
  isPast: boolean;
  isCurrent: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
  isHovered: boolean;
  showLabel: boolean;
}

function CityMarker({ city, color, isSelected, isPast, isCurrent, onClick, onHover, isHovered, showLabel }: CityMarkerProps) {
  const position = latLngToVector3(city.lat, city.lng, 0.015);
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  const date = new Date(city.arriveDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Pulse animation for current city
  useFrame((state) => {
    if (meshRef.current && isCurrent) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
      meshRef.current.scale.setScalar(scale);
    }
    if (ringRef.current && isCurrent) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      ringRef.current.scale.setScalar(scale);
      ringRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  // Determine visual state
  const baseSize = isSelected || isHovered ? 0.022 : 0.016;
  const opacity = isPast ? 0.35 : 1;
  const markerColor = isHovered ? '#fbbf24' : color;

  return (
    <group position={position}>
      {/* Main marker */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerEnter={() => onHover(true)}
        onPointerLeave={() => onHover(false)}
      >
        <sphereGeometry args={[baseSize, 16, 16]} />
        <meshBasicMaterial color={markerColor} opacity={opacity} transparent />
      </mesh>
      
      {/* Pulse ring for current city */}
      {isCurrent && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.025, 0.035, 32]} />
          <meshBasicMaterial color={color} opacity={0.4} transparent side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {/* Label */}
      {(showLabel || isSelected || isHovered) && (
        <Html
          position={[0, 0.05, 0]}
          center
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div className="bg-slate-900/95 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap border border-slate-700/50 shadow-xl backdrop-blur-sm">
            <div className="font-medium">{city.name}</div>
            <div className="text-slate-400 text-[10px]">{date}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Interaction hint overlay
function InteractionHint({ show }: { show: boolean }) {
  if (!show) return null;
  
  return (
    <Html center position={[0, -1.6, 0]} style={{ pointerEvents: 'none' }}>
      <div className="text-slate-500 text-xs bg-slate-900/90 px-4 py-2 rounded-full border border-slate-800">
        🖱️ Drag to rotate • Scroll to zoom
      </div>
    </Html>
  );
}

function Scene({ trips, selectedTripId, onSelectTrip }: GlobeProps) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [hoveredTrip, setHoveredTrip] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(true);
  const controlsRef = useRef<any>(null);

  // Hide hint after first interaction or timeout
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  // Determine trip status
  const getTripStatus = (trip: Trip) => {
    const now = new Date();
    const firstDate = trip.cities[0]?.arriveDate ? new Date(trip.cities[0].arriveDate) : null;
    const lastCity = trip.cities[trip.cities.length - 1];
    const lastDate = lastCity?.departDate || lastCity?.arriveDate;
    const endDate = lastDate ? new Date(lastDate) : null;

    if (endDate && endDate < now) return 'past';
    if (firstDate && firstDate <= now && (!endDate || endDate >= now)) return 'current';
    return 'upcoming';
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} />
      <directionalLight position={[-5, -3, -5]} intensity={0.2} />
      <directionalLight position={[0, 5, 0]} intensity={0.3} />

      <Earth />
      <AutoRotate enabled={autoRotate && !selectedTripId && !hoveredTrip} />

      {trips.map((trip, tripIndex) => {
        const isSelected = trip.id === selectedTripId;
        const isHovered = trip.id === hoveredTrip;
        const status = getTripStatus(trip);
        const isPast = status === 'past';
        const isCurrent = status === 'current';

        return (
          <group key={trip.id}>
            {/* Arcs between consecutive cities */}
            {trip.cities.slice(0, -1).map((city, i) => (
              <TripArc
                key={`${trip.id}-arc-${i}`}
                from={{ lat: city.lat, lng: city.lng }}
                to={{ lat: trip.cities[i + 1].lat, lng: trip.cities[i + 1].lng }}
                color={trip.color}
                isSelected={isSelected}
                isPast={isPast}
                isHovered={isHovered}
                animationOffset={tripIndex * 0.5 + i * 0.2}
                onClick={() => onSelectTrip(trip.id)}
                onHover={(h) => {
                  setHoveredTrip(h ? trip.id : null);
                  setAutoRotate(!h);
                  setShowHint(false);
                }}
              />
            ))}

            {/* City markers */}
            {trip.cities.map((city, index) => (
              <CityMarker
                key={`${trip.id}-${city.id}`}
                city={city}
                color={trip.color}
                isSelected={isSelected}
                isPast={isPast}
                isCurrent={isCurrent && index === 0}
                isHovered={isHovered}
                showLabel={isSelected}
                onClick={() => onSelectTrip(trip.id)}
                onHover={(h) => {
                  setHoveredTrip(h ? trip.id : null);
                  setAutoRotate(!h);
                  setShowHint(false);
                }}
              />
            ))}
          </group>
        );
      })}

      <Stars radius={100} depth={50} count={4000} factor={4} fade speed={0.5} />
      
      <InteractionHint show={showHint && trips.length === 0} />
      
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={1.5}
        maxDistance={4}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        onStart={() => {
          setAutoRotate(false);
          setShowHint(false);
        }}
        onEnd={() => {
          if (!selectedTripId && !hoveredTrip) {
            setTimeout(() => setAutoRotate(true), 4000);
          }
        }}
      />
    </>
  );
}

export function Globe(props: GlobeProps) {
  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
