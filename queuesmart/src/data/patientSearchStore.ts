// src/data/patientSearchStore.ts
import { create } from 'zustand';

interface PatientSearchState {
  searchQuery: string;
  searchType: "name" | "phone"; // Added
  serviceFilter: string;        // Added
  dateFilter: string;
  setSearchQuery: (query: string) => void;
  setSearchType: (type: "name" | "phone") => void; // Added
  setServiceFilter: (service: string) => void;     // Added
  setDateFilter: (date: string) => void;
  clearFilters: () => void;
}

export const usePatientSearchStore = create<PatientSearchState>((set) => ({
  searchQuery: "",
  searchType: "name",
  serviceFilter: "any",
  dateFilter: new Date().toISOString().split('T')[0],
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchType: (type) => set({ searchType: type }),
  setServiceFilter: (service) => set({ serviceFilter: service }),
  setDateFilter: (date) => set({ dateFilter: date }),
  clearFilters: () => set({ 
    searchQuery: "", 
    searchType: "name", 
    serviceFilter: "any", 
    dateFilter: "" 
  }),
}));