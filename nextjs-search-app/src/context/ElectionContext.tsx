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

export function ElectionProvider({ children }: { children: ReactNode }) {
  const [election, setElectionState] = useState<ElectionType>("nagar_parishad");
  const [selectedWard, setSelectedWard] = useState<string>("");
  const [availableWards, setAvailableWards] = useState<number[]>([]);
  const [npWards, setNpWards] = useState<number[]>([]);
  const [vsWards, setVsWards] = useState<number[]>([]);
  const [totalVoters, setTotalVoters] = useState<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem("voter_election_mode");
    if (saved === "vidhan_sabha" || saved === "nagar_parishad") {
      setElectionState(saved);
    }
  }, []);

  // Dynamically load available wards/parts from the databases for both elections
  useEffect(() => {
    fetch('/api/wards?election=nagar_parishad')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setNpWards(data.data);
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
        if (data.success && Array.isArray(data.data)) {
          setVsWards(data.data);
          if (election === 'vidhan_sabha') {
            setAvailableWards(data.data);
            if (data.totalVoters !== undefined) setTotalVoters(data.totalVoters);
          }
        }
      })
      .catch((err) => console.warn('Failed to prefetch vidhan_sabha parts:', err));
  }, []);

  // Update active availableWards and totalVoters when election changes
  useEffect(() => {
    const currentWards = election === 'vidhan_sabha' ? vsWards : npWards;
    if (currentWards.length > 0) {
      setAvailableWards(currentWards);
    }
    fetch(`/api/wards?election=${election}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (Array.isArray(data.data)) setAvailableWards(data.data);
          if (data.totalVoters !== undefined) setTotalVoters(data.totalVoters);
        }
      })
      .catch((err) => console.warn('Failed to fetch active election stats:', err));
  }, [election]);

  const setElection = (type: ElectionType) => {
    setElectionState(type);
    setSelectedWard("");
    localStorage.setItem("voter_election_mode", type);
  };

  const toggleElection = () => {
    setElectionState((prev) => {
      const next = prev === "nagar_parishad" ? "vidhan_sabha" : "nagar_parishad";
      setSelectedWard("");
      localStorage.setItem("voter_election_mode", next);
      return next;
    });
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
