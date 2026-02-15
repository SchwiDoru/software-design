import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import type { Service } from '../../types';

interface ServiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (serviceData: Partial<Service>) => void;
    initialData?: Partial<Service>;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState<Partial<Service>>({
        name: '',
        description: '',
        durationMinutes: 15,
        priority: 'Medium'
    });

    // Reset or populate form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || {
                name: '',
                description: '',
                durationMinutes: 15,
                priority: 'Medium'
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'durationMinutes' ? parseInt(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose(); // Close modal after submit
        // Reset form? Optional
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">{initialData ? 'Edit Service' : 'New Service'}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Service Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-text-subtle mb-1">
                            Service Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            maxLength={100}
                            required
                            className="input-field w-full"
                            placeholder="e.g. General Consultation"
                        />
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-text-subtle mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={3}
                            className="input-field w-full resize-none"
                            placeholder="Describe what this service entails..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-medium text-text-subtle mb-1">
                                Duration (min) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="durationMinutes"
                                value={formData.durationMinutes}
                                onChange={handleChange}
                                min={1}
                                required
                                className="input-field w-full"
                            />
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-text-subtle mb-1">
                                Priority <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="input-field w-full"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            {initialData ? 'Update Service' : 'Create Service'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
