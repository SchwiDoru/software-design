import { useState, useMemo } from "react";
import AdminLayout from "../../admin/AdminLayout";
import { Search, Calendar, Filter, Phone, User, MoreHorizontal, Mail } from "lucide-react";
import { Button } from "../../ui/Button";

// Mock Data for the table
const mockPatients = [
  { id: "USR-001", name: "Alice Brown", email: "alice@example.com", phone: "555-0101", lastVisit: "2026-02-18", lastService: "General Consultation", status: "Active" },
  { id: "USR-002", name: "Bob Wilson", email: "bob@example.com", phone: "555-0102", lastVisit: "2026-02-17", lastService: "Blood Work", status: "Active" },
  { id: "USR-003", name: "Jane Smith", email: "jane@example.com", phone: "555-0103", lastVisit: "2026-02-18", lastService: "Vaccination", status: "Pending" },
];

export default function PatientDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"name" | "phone">("name");
  const [serviceFilter, setServiceFilter] = useState("any");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  // Filtering Logic
  const filteredPatients = useMemo(() => {
    return mockPatients.filter(p => {
      const matchesSearch = searchType === "name" 
        ? p.name.toLowerCase().includes(searchQuery.toLowerCase())
        : p.phone.includes(searchQuery);
      
      const matchesService = serviceFilter === "any" || p.lastService === serviceFilter;
      const matchesDate = !dateFilter || p.lastVisit === dateFilter;

      return matchesSearch && matchesService && matchesDate;
    });
  }, [searchQuery, searchType, serviceFilter, dateFilter]);

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
                  onChange={(e) => setSearchType(e.target.value as any)}
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
                <option value="General Consultation">Consultation</option>
                <option value="Blood Work">Blood Work</option>
                <option value="Vaccination">Vaccination</option>
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
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{patient.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{patient.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2"><Mail size={12}/> {patient.email}</span>
                      <span className="flex items-center gap-2"><Phone size={12}/> {patient.phone}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium">{patient.lastService}</p>
                    <p className="text-xs text-muted-foreground">{patient.lastVisit}</p>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="secondary" size="sm">View History</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredPatients.length === 0 && (
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