import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import type { Service } from "../../types";

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (serviceData: Partial<Service>) => void;
  initialData?: Partial<Service>;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [formData, setFormData] = useState<Partial<Service>>({
    name: "",
    description: "",
    durationMinutes: 15,
    priority: "Medium"
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(
        initialData || {
          name: "",
          description: "",
          durationMinutes: 15,
          priority: "Medium"
        }
      );
    }
  }, [isOpen, initialData]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "durationMinutes" ? Number.parseInt(value, 10) : value
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
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none"
            aria-label="Close modal"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Service Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              maxLength={100}
              required
              className="input-field"
              placeholder="e.g. General Consultation"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="input-field h-auto resize-none py-3"
              placeholder="Describe what this service entails..."
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Duration (min) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleChange}
                min={1}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {initialData ? "Update Service" : "Create Service"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
