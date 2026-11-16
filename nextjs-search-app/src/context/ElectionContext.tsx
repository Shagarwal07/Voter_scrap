"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ElectionType = "nagar_parishad" | "vidhan_sabha";

interface ElectionContextType {
  election: ElectionType;
  setElection: (type: ElectionType) => void;
  toggleElection: () => void;
  isVidhanSabha: boolean;
  selectedWard: string;
  setSelectedWard: (ward: string) => void;
  availableWards: number[];
  setAvailableWards: (wards: number[]) => void;
  npWards: number[];
  vsWards: number[];
  totalVoters: number;
  electionLabel: string;
  electionSubLabel: string;
  partOrWardLabel: string;
}

const ElectionContext = createContext<ElectionContextType | undefined>(undefined);

const DEFAULT_NP_WARDS = Array.from({ length: 55 }, (_, i) => i + 1);
const DEFAULT_VS_PARTS = [92, 95];

export function ElectionProvider({ children }: { children: ReactNode }) {
  const [election, setElectionState] = useState<ElectionType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("voter_election_mode");
      if (saved === "vidhan_sabha" || saved === "nagar_parishad") {
        return saved as ElectionType;
      }
    }
    return "nagar_parishad";
  });

  const [selectedWard, setSelectedWard] = useState<string>("");
  const [npWards, setNpWards] = useState<number[]>(DEFAULT_NP_WARDS);
  const [vsWards, setVsWards] = useState<number[]>(DEFAULT_VS_PARTS);
  const [availableWards, setAvailableWards] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("voter_election_mode");
      if (saved === "vidhan_sabha") return DEFAULT_VS_PARTS;
    }
    return DEFAULT_NP_WARDS;
  });

  const [npTotalVoters, setNpTotalVoters] = useState<number>(0);
  const [vsTotalVoters, setVsTotalVoters] = useState<number>(0);
  const [totalVoters, setTotalVoters] = useState<number>(0);

  // Background hydration to fetch real counts and dynamic database additions
  useEffect(() => {
    let isMounted = true;

    fetch('/api/wards?election=nagar_parishad')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setNpWards(data.data);
          if (data.totalVoters !== undefined) setNpTotalVoters(data.totalVoters);
          if (election === 'nagar_parishad') {
            setAvailableWards(data.data);
            if (data.totalVoters !== undefined) setTotalVoters(data.totalVoters);
          }
        }
      })
      .catch((err) => console.warn('Failed to prefetch nagar_parishad wards:', err));

    fetch('/api/wards?election=vidhan_sabha')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setVsWards(data.data);
          if (data.totalVoters !== undefined) setVsTotalVoters(data.totalVoters);
          if (election === 'vidhan_sabha') {
            setAvailableWards(data.data);
            if (data.totalVoters !== undefined) setTotalVoters(data.totalVoters);
          }
        }
      })
      .catch((err) => console.warn('Failed to prefetch vidhan_sabha parts:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  const setElection = (type: ElectionType) => {
    setElectionState(type);
    setSelectedWard("");
    // Synchronous 0ms immediate switch - no lag, no flicker
    const targetWards = type === "vidhan_sabha"
      ? (vsWards.length > 0 ? vsWards : DEFAULT_VS_PARTS)
      : (npWards.length > 0 ? npWards : DEFAULT_NP_WARDS);
    setAvailableWards(targetWards);
    setTotalVoters(type === "vidhan_sabha" ? vsTotalVoters : npTotalVoters);

    if (typeof window !== "undefined") {
      localStorage.setItem("voter_election_mode", type);
    }
  };

  const toggleElection = () => {
    const next: ElectionType = election === "nagar_parishad" ? "vidhan_sabha" : "nagar_parishad";
    setElection(next);
  };

  const isVidhanSabha = election === "vidhan_sabha";
  const electionLabel = isVidhanSabha ? "विधान सभा चुनाव" : "नगर परिषद चुनाव";
  const electionSubLabel = isVidhanSabha
    ? "137-पचपदरा विधान सभा"
    : "नगर परिषद बालोतरा";
  const partOrWardLabel = isVidhanSabha
    ? selectedWard ? `भाग ${selectedWard}` : "137-पचपदरा"
    : selectedWard ? `वार्ड ${selectedWard}` : "नगर परिषद";

  return (
    <ElectionContext.Provider
      value={{
        election,
        setElection,
        toggleElection,
        isVidhanSabha,
        selectedWard,
        setSelectedWard,
        availableWards,
        setAvailableWards,
        npWards,
        vsWards,
        totalVoters,
        electionLabel,
        electionSubLabel,
        partOrWardLabel,
      }}
    >
      {children}
    </ElectionContext.Provider>
  );
}

export function useElection() {
  const context = useContext(ElectionContext);
  if (context === undefined) {
    throw new Error("useElection must be used within an ElectionProvider");
  }
  return context;
}
