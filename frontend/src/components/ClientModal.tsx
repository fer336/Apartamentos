import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: any) => void;
  client?: any;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  client,
}) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    nationality: '',
    document_type: 'DNI',
    document_id: '',
    whatsapp: '',
    notes: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        full_name: client.full_name || '',
        email: client.email || '',
        phone: client.phone || '',
        nationality: client.nationality || '',
        document_type: client.document_type || 'DNI',
        document_id: client.document_id || '',
        whatsapp: client.whatsapp || '',
        notes: client.notes || '',
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        nationality: '',
        document_type: 'DNI',
        document_id: '',
        whatsapp: '',
        notes: '',
      });
    }
  }, [client, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-purple-100 p-6 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-2xl font-bold text-foreground">
            {client ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                  placeholder="juan@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                  placeholder="+54 9 11 ..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nacionalidad
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                  placeholder="Argentina"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                  placeholder="+54 9 11 ..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo Doc.
                </label>
                <select
                  value={formData.document_type}
                  onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                >
                  <option value="DNI">DNI</option>
                  <option value="Passport">Pasaporte</option>
                  <option value="Other">Otro</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Número Documento
                </label>
                <input
                  type="text"
                  value={formData.document_id}
                  onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none resize-none"
                placeholder="Preferencias, observaciones..."
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t-2 border-purple-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-border hover:bg-gray-50 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 font-medium transition-all shadow-lg"
            >
              {client ? 'Actualizar' : 'Crear'} Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

