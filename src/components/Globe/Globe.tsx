'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Trip } from '@/types';
import { latLngToVector3, getArcMidpoint } from '@/lib/geo';

interface GlobeProps {
  trips: Trip[];
  selectedTripId: string | null;
  onSelectTrip: (id: string | null) => void;
}

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Simple blue sphere for now - textures can be added later
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        color="#1e3a5f"
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

interface TripArcProps {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  color: string;
  isSelected: boolean;
  onClick: () => void;
}

function TripArc({ from, to, color, isSelected, onClick }: TripArcProps) {
  const start = latLngToVector3(from.lat, from.lng);
  const end = latLngToVector3(to.lat, to.lng);
  const mid = getArcMidpoint(from, to);

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const points = curve.getPoints(50);

  return (
    <line onClick={onClick}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={color}
        linewidth={2}
        opacity={isSelected ? 1 : 0.6}
        transparent
      />
    </line>
  );
}

interface CityMarkerProps {
  city: { name: string; lat: number; lng: number; arriveDate: string };
  color: string;
  isSelected: boolean;
  onClick: () => void;
}

function CityMarker({ city, color, isSelected, onClick }: CityMarkerProps) {
  const position = latLngToVector3(city.lat, city.lng, 0.02);
  const date = new Date(city.arriveDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <group position={position}>
      <mesh onClick={onClick}>
        <sphereGeometry args={[isSelected ? 0.025 : 0.018, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {isSelected && (
        <Html
          position={[0, 0.05, 0]}
          center
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div className="bg-slate-900/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-slate-700">
            <div className="font-medium">{city.name}</div>
            <div className="text-slate-400">{date}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Scene({ trips, selectedTripId, onSelectTrip }: GlobeProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1} />

      <Earth />

      {trips.map((trip) => {
        const isSelected = trip.id === selectedTripId;

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
                onClick={() => onSelectTrip(trip.id)}
              />
            ))}

            {/* City markers */}
            {trip.cities.map((city) => (
              <CityMarker
                key={`${trip.id}-${city.id}`}
                city={city}
                color={trip.color}
                isSelected={isSelected}
                onClick={() => onSelectTrip(trip.id)}
              />
            ))}
          </group>
        );
      })}

      <Stars radius={100} depth={50} count={2000} factor={4} fade />
      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={4}
        rotateSpeed={0.5}
      />
    </>
  );
}

export function Globe(props: GlobeProps) {
  return (
    <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}
