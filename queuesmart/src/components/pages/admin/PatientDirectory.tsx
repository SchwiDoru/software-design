import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../admin/AdminLayout";
import { Search, Calendar, Phone, User, Mail } from "lucide-react";
import { Button } from "../../ui/Button";
import { Link } from "react-router-dom";
import { usePatientSearchStore } from "../../../data/patientSearchStore";
import { getPatients } from "../../../services/patients";
import type { PatientSummary } from "../../../types";

export default function PatientDirectory() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    searchQuery, setSearchQuery,
    searchType, setSearchType,
    serviceFilter, setServiceFilter,
    dateFilter, setDateFilter
  } = usePatientSearchStore();

  useEffect(() => {
    let isCancelled = false;

    const loadPatients = async () => {
      try {
        const nextPatients = await getPatients();
        if (!isCancelled) {
          setPatients(nextPatients);
        }
      } catch (error) {
        console.warn("Failed to load patients", error);
        if (!isCancelled) {
          setPatients([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPatients();

    return () => {
      isCancelled = true;
    };
  }, []);

  const serviceOptions = useMemo(() => {
    return Array.from(
      new Set(patients.map((patient) => patient.lastService).filter((service): service is string => Boolean(service)))
    ).sort();
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch = searchType === "name"
        ? patient.name.toLowerCase().includes(searchQuery.toLowerCase())
        : (patient.phoneNumber ?? "").includes(searchQuery);

      const matchesService = serviceFilter === "any" || patient.lastService === serviceFilter;
      const matchesDate = !dateFilter || (patient.lastVisitDate ? patient.lastVisitDate.slice(0, 10) === dateFilter : false);

      return matchesSearch && matchesService && matchesDate;
    });
  }, [patients, searchQuery, searchType, serviceFilter, dateFilter]);

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-7xl pb-20">
        <div className="mb-8">
          <div className="section-label mb-4">
            <span className="section-label-dot" />
            <span className="section-label-text">Database</span>
          </div>
          <h1 className="text-4xl text-foreground">Patient <span className="gradient-text">Directory</span></h1>
          <p className="mt-2 text-muted-foreground">Search and manage all registered users and their visit history.</p>
        </div>

        {/* Filter Bar Section */}
        <div className="surface-card mb-6 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            
            {/* Main Search */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">Search Identity</label>
              <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-4 py-2.5 focus-within:border-accent/50 transition-all">
                {searchType === "name" ? <User size={18} /> : <Phone size={18} />}
                <input 
                  className="bg-transparent border-none outline-none flex-1 text-sm"
                  placeholder={`Enter patient ${searchType}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select 
                  className="bg-background text-[10px] font-bold uppercase py-1 px-2 rounded border border-border"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as "name" | "phone")}
                >
                  <option value="name">Name</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
            </div>

            {/* Date Filter */}
            <div className="w-full lg:w-48">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">Visit Date</label>
              <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-4 py-2 text-sm h-[46px]">
                <Calendar size={16} className="text-accent" />
                <input 
                  type="date" 
                  className="bg-transparent outline-none w-full" 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Service Filter */}
            <div className="w-full lg:w-48">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">Service Type</label>
              <select 
                className="w-full bg-muted/50 border border-border rounded-xl px-4 h-[46px] text-sm outline-none"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
              >
                <option value="any">Any Service</option>
                {serviceOptions.map((service) => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Results */}
        <div className="surface-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/50 border-b border-border">
              <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <th className="p-4 font-medium">Patient Info</th>
                <th className="p-4 font-medium">Contact Details</th>
                <th className="p-4 font-medium">Last Interaction</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">Loading patient directory...</td>
                </tr>
              ) : null}
              {filteredPatients.map((patient) => (
                <tr key={patient.email} className="hover:bg-muted/30 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{patient.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{patient.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2"><Mail size={12}/> {patient.email}</span>
                      <span className="flex items-center gap-2"><Phone size={12}/> {patient.phoneNumber || "No phone on file"}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium">{patient.lastService || "No visit recorded"}</p>
                    <p className="text-xs text-muted-foreground">
                      {patient.lastVisitDate ? new Date(patient.lastVisitDate).toLocaleDateString() : patient.currentStatus || "No activity"}
                    </p>
                  </td>
                  <td className="p-4 text-right">
                    <Link to={`/admin/patients/${encodeURIComponent(patient.email)}`}>
                      <Button variant="secondary" size="sm">
                        Details
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {!isLoading && filteredPatients.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <Search className="mx-auto mb-4 opacity-20" size={48} />
              <p>No patients found matching those filters.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
