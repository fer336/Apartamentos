import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calculator, ArrowRight, Split } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: any) => void;
  booking: any;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  booking,
}) => {
  const [mode, setMode] = useState<'single' | 'mixed'>('single');
  const [currency, setCurrency] = useState<'USD' | 'ARS'>('USD');

  // Montos
  const [amountUSD, setAmountUSD] = useState<number>(0);
  const [amountARS, setAmountARS] = useState<number>(0);

  const [exchangeRate, setExchangeRate] = useState<number>(1200);
  // const [paymentMethod, setPaymentMethod] = useState('cash');

  // Inicializar valores
  useEffect(() => {
    if (booking && isOpen) {
      // Reset
      setMode('single');
      setCurrency('USD');
      setAmountUSD(booking.left_to_pay_usd || 0);
      setAmountARS(0);
    }
  }, [booking, isOpen]);

  // Lógica para modo Single
  useEffect(() => {
    if (mode === 'single' && booking) {
      if (currency === 'ARS') {
        setAmountARS((booking.left_to_pay_usd || 0) * exchangeRate);
        setAmountUSD(0); // En modo single ARS, el input visual es ARS
      } else {
        setAmountUSD(booking.left_to_pay_usd || 0);
        setAmountARS(0);
      }
    }
  }, [currency, mode, exchangeRate, booking]);

  // Lógica para modo Mixed (Auto-fill ARS based on USD input)
  const handleMixedUSDChange = (val: number) => {
    setAmountUSD(val);
    if (booking) {
      const remainingDebt = (booking.left_to_pay_usd || 0) - val;
      if (remainingDebt > 0) {
        setAmountARS(remainingDebt * exchangeRate);
      } else {
        setAmountARS(0);
      }
    }
  };

  const handleMixedARSChange = (val: number) => {
    setAmountARS(val);
    // Opcional: Podríamos recalcular el USD restante, pero es más complejo de UX. 
    // Dejamos que el usuario ajuste.
  };

  const calculateTotalPaidInUSD = () => {
    if (mode === 'single') {
      return currency === 'USD' ? amountUSD : (amountARS / (exchangeRate || 1));
    } else {
      return amountUSD + (amountARS / (exchangeRate || 1));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalTotalUSD = calculateTotalPaidInUSD();

    // Preparamos los datos
    // IMPORTANTE: Enviamos advance_payment_currency: 'USD' para que el backend
    // no intente convertir el monto (ya está calculado en USD)
    const updateData = {
      advance_payment_usd: (booking.advance_payment_usd || 0) + finalTotalUSD,
      advance_payment_currency: 'USD',
      payment_status: 'fully_paid',
      status: 'active',
      left_to_pay_usd: 0,
      balance_payment_usd: 0
    };

    onConfirm(updateData);
  };

  if (!isOpen || !booking) return null;

  const totalPaidUSD = calculateTotalPaidInUSD();
  const debt = booking.left_to_pay_usd || 0;
  const remainingAfterPayment = debt - totalPaidUSD;
  const isCovered = remainingAfterPayment <= 0.01; // Margen de error por decimales

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl animate-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white relative flex-none">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-white/20 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Saldar Reserva</h2>
          </div>
          <p className="text-emerald-50 opacity-90">
            {booking.booking_number} • {booking.client_name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Deuda Total */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-gray-500 uppercase">Total a Pagar</span>
              <span className="text-2xl font-black text-gray-800">${debt.toLocaleString()} USD</span>
            </div>

            {/* Selector de Modo */}
            <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'single' ? 'bg-white shadow text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <DollarSign className="w-4 h-4" /> Pago Simple
              </button>
              <button
                type="button"
                onClick={() => setMode('mixed')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'mixed' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Split className="w-4 h-4" /> Pago Mixto
              </button>
            </div>

            {/* Tipo de Cambio (Siempre necesario si hay ARS implicado) */}
            {(mode === 'mixed' || (mode === 'single' && currency === 'ARS')) && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <label className="block text-xs font-bold text-blue-600 uppercase mb-1 flex items-center gap-1">
                  <Calculator className="w-3 h-3" /> Tipo de Cambio
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-blue-400 font-bold">$</span>
                  <input
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value) || 0;
                      setExchangeRate(rate);
                      // Recalcular ARS si estamos en mixed
                      if (mode === 'mixed') {
                        const remaining = debt - amountUSD;
                        if (remaining > 0) setAmountARS(remaining * rate);
                      } else if (mode === 'single' && currency === 'ARS') {
                        setAmountARS(debt * rate);
                      }
                    }}
                    className="w-full pl-6 pr-4 py-2 bg-white border border-blue-200 rounded-lg font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 text-right"
                  />
                </div>
              </div>
            )}

            {/* Inputs de Pago */}
            <div className="space-y-4">

              {/* MODO SIMPLE */}
              {mode === 'single' && (
                <div>
                  <div className="flex gap-2 mb-2">
                    <button type="button" onClick={() => setCurrency('USD')} className={`flex-1 py-1.5 text-xs font-bold rounded border ${currency === 'USD' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-gray-200 text-gray-500'}`}>USD</button>
                    <button type="button" onClick={() => setCurrency('ARS')} className={`flex-1 py-1.5 text-xs font-bold rounded border ${currency === 'ARS' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-500'}`}>ARS</button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-400 font-bold">$</span>
                    <input
                      type="number"
                      value={currency === 'USD' ? amountUSD : amountARS}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (currency === 'USD') setAmountUSD(val);
                        else setAmountARS(val);
                      }}
                      className="w-full pl-8 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-xl font-black text-gray-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* MODO MIXTO */}
              {mode === 'mixed' && (
                <div className="space-y-3">
                  {/* Parte USD */}
                  <div>
                    <label className="block text-xs font-bold text-emerald-600 uppercase mb-1">Parte en Dólares</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-emerald-400 font-bold">$</span>
                      <input
                        type="number"
                        value={amountUSD}
                        onChange={(e) => handleMixedUSDChange(parseFloat(e.target.value) || 0)}
                        className="w-full pl-6 pr-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-lg font-bold text-gray-800 focus:outline-none focus:border-emerald-500"
                        placeholder="0.00"
                      />
                      <span className="absolute right-4 top-3.5 text-xs font-bold text-emerald-600">USD</span>
                    </div>
                  </div>

                  {/* Parte ARS */}
                  <div>
                    <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Parte en Pesos</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-blue-400 font-bold">$</span>
                      <input
                        type="number"
                        value={amountARS}
                        onChange={(e) => handleMixedARSChange(parseFloat(e.target.value) || 0)}
                        className="w-full pl-6 pr-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl text-lg font-bold text-gray-800 focus:outline-none focus:border-blue-500"
                        placeholder="0.00"
                      />
                      <span className="absolute right-4 top-3.5 text-xs font-bold text-blue-600">ARS</span>
                    </div>
                    <p className="text-right text-xs text-gray-400 mt-1">
                      Equivale a ${(amountARS / (exchangeRate || 1)).toFixed(2)} USD
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="p-6 bg-white border-t border-gray-100 flex-none space-y-4">
            {/* Resumen Final */}
            <div className={`rounded-xl p-4 flex justify-between items-center ${isCovered ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
              <span className="text-sm font-bold">Total Pagado (USD)</span>
              <div className="text-right">
                <div className="text-xl font-black">${totalPaidUSD.toFixed(2)}</div>
                {!isCovered && (
                  <div className="text-xs font-bold opacity-75">Faltan ${remainingAfterPayment.toFixed(2)}</div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!isCovered && Math.abs(remainingAfterPayment) > 1} // Permitir pequeña diferencia por redondeo
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${isCovered
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              {isCovered ? 'Confirmar Pago Total' : 'Pago Incompleto'} <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
