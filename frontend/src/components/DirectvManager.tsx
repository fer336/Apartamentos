import React, { useState, useEffect } from 'react';
import { X, Tv, Plus, Trash2, Calendar, CreditCard, DollarSign, CheckCircle } from 'lucide-react';
import { getDirectvDevices, createDirectvDevice, rechargeDirectvDevice, deleteDirectvDevice } from '../services/api';

interface DirectvManagerProps {
    isOpen: boolean;
    onClose: () => void;
    property: any;
}

export const DirectvManager: React.FC<DirectvManagerProps> = ({
    isOpen,
    onClose,
    property,
}) => {
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'list' | 'add' | 'recharge'>('list');
    const [selectedDevice, setSelectedDevice] = useState<any>(null);

    // Form states
    const [newDevice, setNewDevice] = useState({ location: '', card_number: '', recharge_code: '' });
    const [rechargeData, setRechargeData] = useState({ amount: '', days: '', recharge_code: '' });

    useEffect(() => {
        if (isOpen && property) {
            loadDevices();
        }
    }, [isOpen, property]);

    const loadDevices = async () => {
        setLoading(true);
        try {
            const data = await getDirectvDevices(property.id);
            setDevices(data);
        } catch (error) {
            console.error('Error loading devices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDevice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createDirectvDevice(property.id, newDevice);
            setNewDevice({ location: '', card_number: '', recharge_code: '' });
            setView('list');
            loadDevices();
        } catch (error) {
            console.error('Error creating device:', error);
        }
    };

    const handleRecharge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDevice) return;
        try {
            await rechargeDirectvDevice(selectedDevice.id, {
                amount: parseFloat(rechargeData.amount),
                days: parseInt(rechargeData.days),
                recharge_code: rechargeData.recharge_code
            });
            setRechargeData({ amount: '', days: '', recharge_code: '' });
            setSelectedDevice(null);
            setView('list');
            loadDevices();
        } catch (error) {
            console.error('Error recharging:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este dispositivo?')) {
            try {
                await deleteDirectvDevice(id);
                loadDevices();
            } catch (error) {
                console.error('Error deleting device:', error);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
            <div className="bg-surface rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in zoom-in duration-200 shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary-dark p-6 flex items-center justify-between flex-none text-primary-foreground">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-foreground/20 rounded-xl backdrop-blur-md">
                            <Tv className="w-6 h-6" strokeWidth={1.7} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">DirecTV Prepago</h2>
                            <p className="text-primary-foreground/80 text-sm">{property?.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
                    >
                        <X className="w-6 h-6" strokeWidth={1.7} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-background-alt">

                    {/* VISTA LISTA */}
                    {view === 'list' && (
                        <div className="space-y-4">
                            {devices.length === 0 && !loading ? (
                                <div className="text-center py-12 text-ink-muted">
                                    <Tv className="w-12 h-12 mx-auto mb-3 opacity-50" strokeWidth={1.7} />
                                    <p>No hay dispositivos registrados</p>
                                </div>
                            ) : (
                                devices.map(dev => (
                                    <div key={dev.id} className="bg-surface rounded-2xl p-5 shadow-sm border border-border-subtle hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-ink-primary text-lg flex items-center gap-2">
                                                    {dev.location}
                                                    {dev.days_remaining <= 3 && (
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${dev.days_remaining === 0 ? 'bg-state-red/15 text-state-red' : 'bg-state-yellow/15 text-state-yellow'}`}>
                                                            {dev.days_remaining === 0 ? 'Vencido' : 'Por vencer'}
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="text-ink-secondary text-sm font-mono mt-1 flex items-center gap-1">
                                                    <CreditCard className="w-3 h-3" strokeWidth={1.7} /> {dev.card_number}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDelete(dev.id)}
                                                    className="p-2 text-ink-muted hover:text-state-red hover:bg-state-red/15 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" strokeWidth={1.7} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-state-blue/15 rounded-xl p-3">
                                                <span className="text-xs font-bold text-state-blue uppercase block mb-1">Días Restantes</span>
                                                <div className="text-2xl font-black text-state-blue">{dev.days_remaining}</div>
                                            </div>
                                            <div className="bg-surface-hover rounded-xl p-3">
                                                <span className="text-xs font-bold text-ink-muted uppercase block mb-1">Vencimiento</span>
                                                <div className="text-sm font-bold text-ink-primary">
                                                    {dev.expiry_date ? new Date(dev.expiry_date).toLocaleDateString() : '-'}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setSelectedDevice(dev);
                                                setView('recharge');
                                            }}
                                            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" strokeWidth={1.7} /> Registrar Recarga
                                        </button>
                                    </div>
                                ))
                            )}

                            <button
                                onClick={() => setView('add')}
                                className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-ink-secondary font-medium hover:border-primary hover:text-primary hover:bg-primary-soft transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" strokeWidth={1.7} /> Agregar Nuevo Dispositivo
                            </button>
                        </div>
                    )}

                    {/* VISTA AGREGAR */}
                    {view === 'add' && (
                        <form onSubmit={handleAddDevice} className="space-y-6">
                            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border-subtle space-y-4">
                                <h3 className="font-bold text-ink-primary mb-4">Nuevo Dispositivo</h3>

                                <div>
                                    <label className="block text-sm font-medium text-ink-secondary mb-1">Ubicación *</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ej: Living, Dormitorio Principal"
                                        value={newDevice.location}
                                        onChange={e => setNewDevice({ ...newDevice, location: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-ink-secondary mb-1">Número de Tarjeta (12 dígitos) *</label>
                                    <input
                                        required
                                        type="text"
                                        maxLength={20}
                                        placeholder="0000 0000 0000"
                                        value={newDevice.card_number}
                                        onChange={e => setNewDevice({ ...newDevice, card_number: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-ink-secondary mb-1">Código de Recarga (Opcional)</label>
                                    <input
                                        type="text"
                                        placeholder="Último código usado"
                                        value={newDevice.recharge_code}
                                        onChange={e => setNewDevice({ ...newDevice, recharge_code: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setView('list')}
                                    className="flex-1 py-3 bg-surface border border-border text-ink-secondary rounded-xl font-medium hover:bg-surface-hover"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary-hover shadow-lg shadow-primary/20"
                                >
                                    Guardar Dispositivo
                                </button>
                            </div>
                        </form>
                    )}

                    {/* VISTA RECARGAR */}
                    {view === 'recharge' && selectedDevice && (
                        <form onSubmit={handleRecharge} className="space-y-6">
                            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border-subtle space-y-4">
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border-subtle">
                                    <div className="p-2 bg-primary-soft rounded-lg text-primary">
                                        <Tv className="w-5 h-5" strokeWidth={1.7} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-ink-primary">Recargar {selectedDevice.location}</h3>
                                        <p className="text-xs text-ink-secondary font-mono">{selectedDevice.card_number}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-ink-secondary mb-1">Monto ($) *</label>
                                        <div className="relative">
                                            <DollarSign className="w-4 h-4 absolute left-3 top-3.5 text-ink-muted" strokeWidth={1.7} />
                                            <input
                                                required
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={rechargeData.amount}
                                                onChange={e => setRechargeData({ ...rechargeData, amount: e.target.value })}
                                                className="w-full pl-9 pr-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-ink-secondary mb-1">Días Cargados *</label>
                                        <div className="relative">
                                            <Calendar className="w-4 h-4 absolute left-3 top-3.5 text-ink-muted" strokeWidth={1.7} />
                                            <input
                                                required
                                                type="number"
                                                placeholder="Ej: 30"
                                                value={rechargeData.days}
                                                onChange={e => setRechargeData({ ...rechargeData, days: e.target.value })}
                                                className="w-full pl-9 pr-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-ink-secondary mb-1">Código de Recarga (Opcional)</label>
                                    <input
                                        type="text"
                                        placeholder="Código de 18 dígitos"
                                        value={rechargeData.recharge_code}
                                        onChange={e => setRechargeData({ ...rechargeData, recharge_code: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm"
                                    />
                                    <p className="text-xs text-ink-muted mt-1">Guardar el código puede ser útil para reclamos.</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setView('list');
                                        setSelectedDevice(null);
                                    }}
                                    className="flex-1 py-3 bg-surface border border-border text-ink-secondary rounded-xl font-medium hover:bg-surface-hover"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-state-green hover:bg-state-green/90 text-primary-foreground rounded-xl font-medium shadow-lg shadow-state-green/20 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-5 h-5" strokeWidth={1.7} /> Confirmar Recarga
                                </button>
                            </div>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
};
