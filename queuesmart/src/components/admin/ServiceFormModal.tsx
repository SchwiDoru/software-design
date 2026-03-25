import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import type { Service } from "../../types";

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (serviceData: Partial<Service>) => void;
  onDelete?: () => Promise<void>; // Changed to Promise to handle async errors
  initialData?: Partial<Service>;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData
}) => {
  const [formData, setFormData] = useState<Partial<Service>>({
    name: "",
    description: "",
    duration: 15,
    priority: "Medium"
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(
        initialData || {
          name: "",
          description: "",
          duration: 15,
          priority: "Medium"
        }
      );
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "duration" ? Number.parseInt(value, 10) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_25px_rgba(15,23,42,0.1)]">
        <div className="flex items-center justify-between border-b border-border bg-muted/60 p-6">
          <h2 className="text-2xl text-foreground">{initialData ? "Edit Service" : "New Service"}</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted">x</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Form Fields... (Name, Description, etc. stay the same) */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Service Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input-field" />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Description *</label>
            <textarea name="description" value={formData.description} onChange={handleChange} required rows={3} className="input-field h-auto resize-none py-3" />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Duration (min) *</label>
              <input type="number" name="duration" value={formData.duration} onChange={handleChange} min={1} required className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Priority *</label>
              <select name="priority" value={formData.priority} onChange={handleChange} className="input-field">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* --- NEW SECTION: DELETE REQUIREMENTS --- */}
          {initialData && (
            <div className="mb-6 rounded-lg bg-red-50/50 p-3 border border-red-100">
              <p className="text-xs text-red-600 font-medium">
                ⚠️ To delete this service:
              </p>
              <ul className="list-disc list-inside text-[11px] text-red-500 mt-1 italic">
                <li>Queue must be <strong>Closed</strong></li>
                <li>No patients can be in the queue</li>
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
            {initialData && onDelete && (
              <div className="flex-1">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={onDelete}
                  className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  Delete Service
                </Button>
              </div>
            )}
            
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">
              {initialData ? "Update Service" : "Create Service"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};