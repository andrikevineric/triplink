'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Trip } from '@/types';
import { latLngToVector3, getArcMidpoint } from '@/lib/geo';

interface GlobeProps {
  trips: Trip[];
  selectedTripId: string | null;
  onSelectTrip: (id: string | null) => void;
}

// Earth with texture
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Use a procedural earth-like appearance
  // In production, replace with actual texture from NASA Blue Marble
  return (
    <group>
      {/* Main Earth sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color="#1a365d"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Continent hints - simplified land masses */}
      <mesh>
        <sphereGeometry args={[1.001, 64, 64]} />
        <meshStandardMaterial
          color="#1e4d2b"
          roughness={0.9}
          metalness={0}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Outer atmosphere */}
      <mesh scale={[1.25, 1.25, 1.25]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.05}
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
      angleRef.current += delta * 0.1;
      const radius = camera.position.length();
      camera.position.x = Math.sin(angleRef.current) * radius;
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
}

function TripArc({ from, to, color, isSelected, isPast, onClick, onHover, isHovered }: TripArcProps) {
  const start = latLngToVector3(from.lat, from.lng);
  const end = latLngToVector3(to.lat, to.lng);
  const mid = getArcMidpoint(from, to);

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const points = curve.getPoints(50);

  // Determine visual state
  const opacity = isPast ? 0.3 : isSelected || isHovered ? 1 : 0.6;
  const lineColor = isHovered ? '#fbbf24' : color; // Gold on hover

  return (
    <line
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
}

function CityMarker({ city, color, isSelected, isPast, isCurrent, onClick, onHover, isHovered }: CityMarkerProps) {
  const position = latLngToVector3(city.lat, city.lng, 0.02);
  const meshRef = useRef<THREE.Mesh>(null);
  
  const date = new Date(city.arriveDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Pulse animation for current city
  useFrame((state) => {
    if (meshRef.current && isCurrent) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      meshRef.current.scale.setScalar(scale);
    }
  });

  // Determine visual state
  const baseSize = isSelected || isHovered ? 0.025 : 0.018;
  const opacity = isPast ? 0.4 : 1;
  const markerColor = isHovered ? '#fbbf24' : color; // Gold on hover

  return (
    <group position={position}>
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
      
      {/* Glow ring for current city */}
      {isCurrent && (
        <mesh>
          <ringGeometry args={[0.03, 0.04, 32]} />
          <meshBasicMaterial color={color} opacity={0.5} transparent side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {(isSelected || isHovered) && (
        <Html
          position={[0, 0.06, 0]}
          center
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div className="bg-slate-900/95 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap border border-slate-700 shadow-xl">
            <div className="font-semibold">{city.name}</div>
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
    <Html center position={[0, -1.5, 0]} style={{ pointerEvents: 'none' }}>
      <div className="text-slate-400 text-xs bg-slate-900/80 px-3 py-1.5 rounded-full animate-pulse">
        Drag to rotate • Scroll to zoom
      </div>
    </Html>
  );
}

function Scene({ trips, selectedTripId, onSelectTrip }: GlobeProps) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [hoveredTrip, setHoveredTrip] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(true);
  const controlsRef = useRef<any>(null);

  // Hide hint after first interaction
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 5000);
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
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1} />
      <directionalLight position={[-5, -3, -5]} intensity={0.3} />

      <Earth />
      <AutoRotate enabled={autoRotate && !selectedTripId && !hoveredTrip} />

      {trips.map((trip) => {
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
                isCurrent={isCurrent && index === 0} // First city of current trip
                isHovered={isHovered}
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

      <Stars radius={100} depth={50} count={3000} factor={4} fade />
      
      <InteractionHint show={showHint} />
      
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={1.5}
        maxDistance={4}
        rotateSpeed={0.5}
        onStart={() => {
          setAutoRotate(false);
          setShowHint(false);
        }}
        onEnd={() => {
          if (!selectedTripId && !hoveredTrip) {
            setTimeout(() => setAutoRotate(true), 3000);
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
