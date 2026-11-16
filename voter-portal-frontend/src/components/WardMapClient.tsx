"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { Info } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import wardPoints from "@/data/nagar_parishad/wardCoordinates.json";

export interface WardMapClientProps {
  activeWardId: number | null;
  setActiveWardId: (id: number) => void;
}

export default function WardMapClient({ activeWardId, setActiveWardId }: WardMapClientProps) {
  const [mounted, setMounted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[400px] md:h-[600px] flex items-center justify-center bg-[#E1D7BC]">
        <span className="font-courier tracking-widest text-[#1E2A42] font-bold">INITIALIZING MAP...</span>
      </div>
    );
  }

  const centerLat = 25.8340;
  const centerLon = 72.2460;

  return (
    <div className="w-full h-[400px] md:h-[600px] bg-[#E1D7BC] relative z-0">
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end">
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className="bg-[#1E2A42] text-[#E9E1CC] p-2 rounded-full border-2 border-[#A2382B] shadow-[2px_2px_0_rgba(162,56,43,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0_rgba(162,56,43,1)] transition-all cursor-pointer"
          title="Data Source Information"
        >
          <Info className="w-5 h-5" />
        </button>
        {showInfo && (
          <div className="mt-2 bg-[#1E2A42] text-[#E9E1CC] px-3 py-2 font-courier text-xs tracking-widest border-2 border-[#A2382B] shadow-[3px_3px_0_rgba(30,42,66,1)]">
            DATA SOURCE:<br />ELECTION.BALOTRANEWS.COM
          </div>
        )}
      </div>
      <MapContainer
        center={[centerLat, centerLon]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {wardPoints.map((p) => {
          const isActive = activeWardId === p.ward;
          const bg = isActive ? "#A2382B" : "#1E2A42";
          const color = isActive ? "#E9E1CC" : "#E9E1CC";
          const border = isActive ? "2px solid #E9E1CC" : "2px solid #A2382B";
          const scale = isActive ? "scale(1.2)" : "scale(1)";

          const customIcon = L.divIcon({
            className: "custom-ward-marker",
            html: `<div style="
              background: ${bg}; 
              color: ${color}; 
              border: ${border}; 
              border-radius: 50%; 
              width: 32px; 
              height: 32px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-family: 'Courier Prime', monospace; 
              font-weight: 700; 
              font-size: 13px; 
              box-shadow: 2px 2px 0 rgba(0,0,0,0.5);
              transform: ${scale};
              transition: all 0.2s ease;
            ">${p.ward}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          return (
            <Marker
              key={p.ward}
              position={[p.lat, p.lon]}
              icon={customIcon}
              eventHandlers={{
                click: () => setActiveWardId(p.ward),
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
