"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Stars } from "@react-three/drei";
import * as THREE from "three";
import { Activity, Users, Globe2 } from "lucide-react";

// --- Types & Data Simulation ---
interface UserNode {
  id: string;
  lat: number;
  lng: number;
  status: "active" | "idle" | "connecting";
  latency: number;
}

const generateMockUsers = (count: number): UserNode[] => {
  return Array.from({ length: count }).map(() => ({
    id: `usr_${Math.random().toString(36).substr(2, 6)}`,
    lat: (Math.random() - 0.5) * 160, // Avoid extreme poles for better visual distribution
    lng: (Math.random() - 0.5) * 360,
    status: Math.random() > 0.8 ? "connecting" : Math.random() > 0.3 ? "active" : "idle",
    latency: Math.floor(Math.random() * 200) + 10,
  }));
};

// --- Math Helper: Lat/Lng to 3D Cartesian ---
const getCoordinates = (lat: number, lng: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
};

// --- 3D User Node Component ---
const UserMarker = ({ user, radius }: { user: UserNode; radius: number }) => {
  const [hovered, setHovered] = useState(false);
  const position = useMemo(() => getCoordinates(user.lat, user.lng, radius), [user.lat, user.lng, radius]);

  const colorMap = {
    active: "#22c55e", // Green
    idle: "#f59e0b",   // Amber
    connecting: "#3b82f6" // Blue
  };

  return (
    <mesh
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshBasicMaterial color={colorMap[user.status]} />
      
      {/* Glow effect */}
      <mesh>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={colorMap[user.status]} transparent opacity={0.3} />
      </mesh>

      {/* HTML Tooltip on Hover */}
      {hovered && (
        <Html distanceFactor={15} zIndexRange={[100, 0]}>
          <div className="bg-slate-950/90 border border-slate-800 text-slate-200 p-3 rounded-lg shadow-2xl backdrop-blur-md w-48 text-sm pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2.5">
            <div className="font-mono text-xs text-slate-400 mb-1 border-b border-slate-800 pb-1">ID: {user.id}</div>
            <div className="flex justify-between items-center py-1">
              <span className="capitalize flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-[${colorMap[user.status]}]`} />
                {user.status}
              </span>
              <span className={`${user.latency > 150 ? 'text-red-400' : 'text-slate-300'}`}>
                {user.latency}ms
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {user.lat.toFixed(2)}°, {user.lng.toFixed(2)}°
            </div>
          </div>
        </Html>
      )}
    </mesh>
  );
};

// --- 3D Globe Component ---
const Globe = ({ users }: { users: UserNode[] }) => {
  const groupRef = useRef<THREE.Group>(null);
  const GLOBE_RADIUS = 2;

  // Auto-rotation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Base Earth Sphere */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial 
          color="#020617" // Very dark slate
          emissive="#020617"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Wireframe overlay for "Tech" aesthetic */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS + 0.01, 32, 32]} />
        <meshBasicMaterial color="#1e293b" wireframe transparent opacity={0.3} />
      </mesh>

      {/* Render Users */}
      {users.map((user) => (
        <UserMarker key={user.id} user={user} radius={GLOBE_RADIUS} />
      ))}
    </group>
  );
};

// --- Main Container Component (Exported) ---
export default function GodEyeGlobe() {
  const [users, setUsers] = useState<UserNode[]>([]);

  // Simulate initial load and incoming WebSocket data
  useEffect(() => {
    setUsers(generateMockUsers(150));

    const interval = setInterval(() => {
      // Simulate 5 new users connecting every few seconds
      setUsers(prev => [...prev.slice(5), ...generateMockUsers(5)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const simulateSpike = () => {
    setUsers(prev => [...prev, ...generateMockUsers(50)]);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      
      {/* 2D Overlay UI (Tailwind + shadcn aesthetic) */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl backdrop-blur-xl shadow-2xl min-w-[280px]">
          <h1 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Globe2 className="w-5 h-5 text-blue-500" />
            Global Traffic
          </h1>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4" /> Active Nodes
              </span>
              <span className="text-2xl font-mono text-white">{users.length}</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Network Status
              </span>
              <span className="text-sm px-2 py-1 bg-green-500/20 text-green-400 rounded-md font-medium">
                Stable
              </span>
            </div>
          </div>

          <button 
            onClick={simulateSpike}
            className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Simulate Traffic Spike
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />
        
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        
        <Globe users={users} />
        
        <OrbitControls 
          enablePan={false} 
          minDistance={3} 
          maxDistance={10}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}