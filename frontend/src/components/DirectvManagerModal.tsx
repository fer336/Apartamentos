import { useState, useEffect } from 'react';
import { X, Tv, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { getDirectvDevices, createDirectvDevice, rechargeDirectvDevice, deleteDirectvDevice } from '../services/api';

interface DirectvDevice {
  id: string;
  property_id: string;
  location: string;
  card_number: string;
  recharge_code: string | null;
  last_amount_loaded: number;
  last_days_loaded: number;
  loaded_at: string | null;
  expiry_date: string | null;
  days_remaining: number;
}

interface Property {
  id: string;
  name: string;
}

interface DirectvManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onUpdate: () => void;
}

export const DirectvManagerModal: React.FC<DirectvManagerModalProps> = ({
  isOpen,
  onClose,
  properties,
  onUpdate
}) => {
  const [devices, setDevices] = useState<DirectvDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DirectvDevice | null>(null);
  
  // Form states
  const [newDevice, setNewDevice] = useState({
    property_id: '',
    location: '',
    card_number: '',
    recharge_code: '',
    amount_loaded: 0,
    days_loaded: 0
  });

  const [rechargeForm, setRechargeForm] = useState({
    recharge_code: '',
    amount_loaded: 0,
    days_loaded: 0
  });

  useEffect(() => {
    if (isOpen) {
      fetchAllDevices();
    }
  }, [isOpen]);

  const fetchAllDevices = async () => {
    try {
      setLoading(true);
      const allDevices: DirectvDevice[] = [];
      
      for (const property of properties) {
        const propertyDevices = await getDirectvDevices(property.id);
        allDevices.push(...propertyDevices);
      }
      
      setDevices(allDevices);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async () => {
    if (!newDevice.property_id || !newDevice.location || !newDevice.card_number) {
      alert('Por favor completá todos los campos obligatorios');
      return;
    }

    try {
      await createDirectvDevice(newDevice.property_id, newDevice);
      setShowAddForm(false);
      setNewDevice({
        property_id: '',
        location: '',
        card_number: '',
        recharge_code: '',
        amount_loaded: 0,
        days_loaded: 0
      });
      await fetchAllDevices();
      onUpdate();
    } catch (error) {
      console.error('Error adding device:', error);
      alert('Error al agregar dispositivo');
    }
  };

  const handleRecharge = async () => {
    if (!selectedDevice || !rechargeForm.recharge_code || rechargeForm.days_loaded <= 0) {
      alert('Por favor completá todos los campos');
      return;
    }

    try {
      await rechargeDirectvDevice(selectedDevice.id, rechargeForm);
      setSelectedDevice(null);
      setRechargeForm({ recharge_code: '', amount_loaded: 0, days_loaded: 0 });
      await fetchAllDevices();
      onUpdate();
    } catch (error) {
      console.error('Error recharging device:', error);
      alert('Error al recargar dispositivo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este dispositivo?')) return;

    try {
      await deleteDirectvDevice(id);
      await fetchAllDevices();
      onUpdate();
    } catch (error) {
      console.error('Error deleting device:', error);
      alert('Error al eliminar dispositivo');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Gestión DirecTV Prepago</h2>
              <p className="text-sm text-blue-100">Administrá todas las tarjetas DirecTV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Add Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-2xl hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-blue-600 font-bold group"
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Agregar Nuevo Dispositivo DirecTV
            </button>
          )}

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Nuevo Dispositivo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Propiedad *</label>
                  <select
                    value={newDevice.property_id}
                    onChange={(e) => setNewDevice({ ...newDevice, property_id: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccioná una propiedad</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.id}>{prop.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ubicación *</label>
                  <input
                    type="text"
                    value={newDevice.location}
                    onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                    placeholder="Ej: Living, Habitación Principal"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Número de Tarjeta *</label>
                  <input
                    type="text"
                    value={newDevice.card_number}
                    onChange={(e) => setNewDevice({ ...newDevice, card_number: e.target.value })}
                    placeholder="Ej: 1234-5678-9012"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Código de Recarga (Opcional)</label>
                  <input
                    type="text"
                    value={newDevice.recharge_code}
                    onChange={(e) => setNewDevice({ ...newDevice, recharge_code: e.target.value })}
                    placeholder="Código inicial"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Monto Cargado (ARS)</label>
                  <input
                    type="number"
                    value={newDevice.amount_loaded}
                    onChange={(e) => setNewDevice({ ...newDevice, amount_loaded: parseFloat(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Días Cargados</label>
                  <input
                    type="number"
                    value={newDevice.days_loaded}
                    onChange={(e) => setNewDevice({ ...newDevice, days_loaded: parseInt(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAddDevice}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Guardar Dispositivo
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Devices List */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Cargando dispositivos...</div>
          ) : devices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Tv className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No hay dispositivos registrados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map(device => {
                const property = properties.find(p => p.id === device.property_id);
                const isExpiringSoon = device.days_remaining <= 3;
                
                return (
                  <div
                    key={device.id}
                    className={`p-5 rounded-2xl border-2 ${
                      isExpiringSoon
                        ? 'bg-red-50 border-red-200'
                        : 'bg-white border-gray-200'
                    } shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isExpiringSoon ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          <Tv className={`w-6 h-6 ${isExpiringSoon ? 'text-red-600' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500">{property?.name}</p>
                          <p className="font-black text-gray-800">{device.location}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(device.id)}
                        className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tarjeta:</span>
                        <span className="font-bold">{device.card_number}</span>
                      </div>
                      {device.expiry_date && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Vence:</span>
                          <span className="font-bold">
                            {new Date(device.expiry_date).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      )}
                      <div className={`flex items-center justify-between p-2 rounded-lg ${
                        isExpiringSoon ? 'bg-red-100' : 'bg-emerald-100'
                      }`}>
                        <span className={`text-xs font-bold ${
                          isExpiringSoon ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                          DÍAS RESTANTES
                        </span>
                        <span className={`text-2xl font-black ${
                          isExpiringSoon ? 'text-red-700' : 'text-emerald-700'
                        }`}>
                          {device.days_remaining}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedDevice(device);
                        setRechargeForm({ recharge_code: '', amount_loaded: 0, days_loaded: 0 });
                      }}
                      className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                        isExpiringSoon
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Recargar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recharge Modal */}
        {selectedDevice && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  Recargar {selectedDevice.location}
                </h3>
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Código de Recarga *</label>
                  <input
                    type="text"
                    value={rechargeForm.recharge_code}
                    onChange={(e) => setRechargeForm({ ...rechargeForm, recharge_code: e.target.value })}
                    placeholder="Ingresá el código"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Monto (ARS)</label>
                  <input
                    type="number"
                    value={rechargeForm.amount_loaded}
                    onChange={(e) => setRechargeForm({ ...rechargeForm, amount_loaded: parseFloat(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Días *</label>
                  <input
                    type="number"
                    value={rechargeForm.days_loaded}
                    onChange={(e) => setRechargeForm({ ...rechargeForm, days_loaded: parseInt(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleRecharge}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Confirmar Recarga
                </button>
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="px-6 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
