import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Trash2, Edit2, X } from 'lucide-react';
import Papa from 'papaparse';

interface CSVRow {
  Name: string;
  'Lease Start Date': string;
  'Lease End Date': string;
  Price: string;
  Deposit: string;
  'Left to Pay': string;
  Status: string;
}

interface ParsedBooking {
  id: string;
  clientName: string;
  checkIn: string;
  checkOut: string;
  price: number;
  currency: string;
  deposit: number;
  depositCurrency: string;
  leftToPay: number;
  leftToPayCurrency: string;
  status: string;
  property?: string;
  errors: string[];
}

export const Import = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedBooking[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors?: string[] } | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Parsear fechas del CSV (pueden venir en formato "December 15, 2024" o "January 4, 2025")
  const parseDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) throw new Error('Invalid date');
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    } catch {
      return '';
    }
  };

  // Parsear precio y detectar moneda
  const parsePrice = (priceStr: string): { amount: number; currency: string } => {
    const cleaned = priceStr.replace(/[^0-9.,]/g, '');
    const amount = parseFloat(cleaned.replace(',', ''));
    
    // Detectar moneda basado en el formato
    if (priceStr.includes('ARS') || priceStr.includes('$') && amount > 10000) {
      return { amount, currency: 'ARS' };
    }
    return { amount, currency: 'USD' };
  };

  // Validar una reserva
  const validateBooking = (booking: Partial<ParsedBooking>): string[] => {
    const errors: string[] = [];
    
    if (!booking.clientName || booking.clientName.trim() === '') {
      errors.push('Nombre del cliente requerido');
    }
    if (!booking.checkIn) {
      errors.push('Fecha de check-in inválida');
    }
    if (!booking.checkOut) {
      errors.push('Fecha de check-out inválida');
    }
    if (booking.checkIn && booking.checkOut && booking.checkIn >= booking.checkOut) {
      errors.push('Check-out debe ser después de check-in');
    }
    if (!booking.price || booking.price <= 0) {
      errors.push('Precio inválido');
    }
    
    return errors;
  };

  // Procesar el CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setImportResult(null);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        
        const parsed: ParsedBooking[] = data.map((row, index) => {
          const priceData = parsePrice(row.Price || '0');
          const depositData = parsePrice(row.Deposit || '0');
          const leftToPayData = parsePrice(row['Left to Pay'] || '0');

          const booking: ParsedBooking = {
            id: `temp-${index}`,
            clientName: row.Name || '',
            checkIn: parseDate(row['Lease Start Date']),
            checkOut: parseDate(row['Lease End Date']),
            price: priceData.amount,
            currency: priceData.currency,
            deposit: depositData.amount,
            depositCurrency: depositData.currency,
            leftToPay: leftToPayData.amount,
            leftToPayCurrency: leftToPayData.currency,
            status: row.Status?.toLowerCase().includes('servicio') ? 'active' : 'pending',
            errors: []
          };

          booking.errors = validateBooking(booking);
          return booking;
        });

        setParsedData(parsed);
      },
      error: (error) => {
        alert(`Error al leer el archivo: ${error.message}`);
      }
    });
  };

  // Editar una fila
  const handleEdit = (index: number, field: keyof ParsedBooking, value: any) => {
    const updated = [...parsedData];
    (updated[index] as any)[field] = value;
    updated[index].errors = validateBooking(updated[index]);
    setParsedData(updated);
  };

  // Eliminar una fila
  const handleDelete = (index: number) => {
    setParsedData(parsedData.filter((_, i) => i !== index));
  };

  // Importar datos
  const handleImport = async () => {
    const validBookings = parsedData.filter(b => b.errors.length === 0);
    
    if (validBookings.length === 0) {
      alert('No hay reservas válidas para importar');
      return;
    }

    if (!confirm(`¿Importar ${validBookings.length} reservas?`)) return;

    setImporting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bookings/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookings: validBookings })
      });

      if (!response.ok) throw new Error('Error al importar');

      const result = await response.json();
      setImportResult(result);
      
      // Mostrar errores en consola para debugging
      if (result.errors && result.errors.length > 0) {
        console.error('❌ Errores de importación:', result.errors);
      }
      
      if (result.success > 0) {
        setTimeout(() => navigate('/calendar'), 2000);
      } else {
        // Si todas fallaron, mostrar el primer error
        if (result.errors && result.errors.length > 0) {
          alert(`Error en importación:\n${result.errors[0]}\n\nRevisa la consola del navegador para ver todos los errores.`);
        }
      }
    } catch (error) {
      alert('Error al importar las reservas');
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  // Exportar datos actuales
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bookings/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reservas-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al exportar las reservas');
      console.error(error);
    }
  };

  // Limpiar todo y resetear
  const handleClear = () => {
    if (parsedData.length > 0 && !confirm('¿Deseas limpiar todo y cargar un nuevo archivo?')) {
      return;
    }
    setFile(null);
    setParsedData([]);
    setImportResult(null);
    setEditingIndex(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = parsedData.filter(b => b.errors.length === 0).length;
  const errorCount = parsedData.length - validCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 rounded-2xl bg-white border-2 border-blue-100 hover:bg-blue-50 flex items-center justify-center transition-all shadow-sm"
          >
            <ArrowLeft className="w-6 h-6 text-blue-600" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
              Importar / Exportar
            </h1>
            <p className="text-gray-500 mt-1 font-medium text-sm md:text-base">Carga masiva de reservas desde CSV</p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {parsedData.length > 0 && (
            <button
              onClick={handleClear}
              className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
          <button
            onClick={handleExport}
            className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-blue-200 p-12 text-center hover:border-blue-400 transition-all cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-4">
          <Upload className="w-10 h-10 text-blue-500" />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">
          {file ? file.name : 'Selecciona un archivo CSV'}
        </h3>
        <p className="text-gray-500 font-medium mb-4">
          Arrastra y suelta o haz clic para seleccionar
        </p>
        <p className="text-xs text-gray-400 font-mono">
          Columnas: Name, Lease Start Date, Lease End Date, Price, Deposit, Status
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Vista Preliminar
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                <span className="text-emerald-600 font-bold">{validCount} válidas</span>
                {errorCount > 0 && <span className="text-rose-600 font-bold ml-2">{errorCount} con errores</span>}
              </p>
            </div>
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Importar {validCount}
                </>
              )}
            </button>
          </div>

          {/* Mobile View - Cards */}
          <div className="block lg:hidden divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {parsedData.map((booking, index) => (
              <div key={booking.id} className={`p-4 ${booking.errors.length > 0 ? 'bg-rose-50/30' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    {editingIndex === index ? (
                      <input
                        type="text"
                        value={booking.clientName}
                        onChange={(e) => handleEdit(index, 'clientName', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-2 border-blue-200 focus:border-blue-400 outline-none font-bold"
                      />
                    ) : (
                      <div className="font-black text-gray-900">{booking.clientName}</div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                      className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-gray-500 font-bold">Check-in:</span>
                    <div className="font-bold text-gray-900">{booking.checkIn || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold">Check-out:</span>
                    <div className="font-bold text-gray-900">{booking.checkOut || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold">Precio:</span>
                    <div className="font-bold text-gray-900">{booking.currency} {booking.price.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold">Depósito:</span>
                    <div className="font-bold text-gray-900">{booking.depositCurrency} {booking.deposit.toLocaleString()}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 font-bold">Por Pagar:</span>
                    <div className="font-bold text-rose-600">{booking.leftToPayCurrency} {booking.leftToPay.toLocaleString()}</div>
                  </div>
                </div>

                {booking.errors.length > 0 && (
                  <div className="bg-rose-100 rounded-lg p-2 mt-2">
                    {booking.errors.map((error, i) => (
                      <div key={i} className="text-[10px] text-rose-700 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden lg:block overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50/95 backdrop-blur">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Cliente</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Check-in</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Check-out</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Precio</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Depósito</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Por Pagar</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Estado</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {parsedData.map((booking, index) => (
                  <tr key={booking.id} className={`hover:bg-gray-50 ${booking.errors.length > 0 ? 'bg-rose-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{booking.clientName}</div>
                      {booking.errors.length > 0 && (
                        <div className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {booking.errors[0]}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{booking.checkIn || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{booking.checkOut || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{booking.currency} {booking.price.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{booking.depositCurrency} {booking.deposit.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-rose-600">{booking.leftToPayCurrency} {booking.leftToPay.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {booking.errors.length === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3 h-3" /> Válido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700">
                          <AlertCircle className="w-3 h-3" /> Error
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(index)}
                        className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className={`rounded-2xl p-6 border-2 ${importResult.success > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <div className="flex items-start gap-3">
            {importResult.success > 0 ? (
              <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-8 h-8 text-rose-600 shrink-0" />
            )}
            <div className="flex-1">
              <h4 className={`text-lg font-black ${importResult.success > 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                {importResult.success > 0 ? 'Importación Completada' : 'Error en Importación'}
              </h4>
              <p className={`text-sm font-medium mt-1 ${importResult.success > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {importResult.success} reservas importadas exitosamente
                {importResult.failed > 0 && `, ${importResult.failed} fallidas`}
              </p>
              
              {/* Mostrar errores si existen */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  <p className="text-xs font-black text-rose-800 uppercase">Errores detallados:</p>
                  {importResult.errors.slice(0, 10).map((error: string, index: number) => (
                    <div key={index} className="text-xs text-rose-700 bg-white rounded-lg p-2 font-mono">
                      {error}
                    </div>
                  ))}
                  {importResult.errors.length > 10 && (
                    <p className="text-xs text-rose-600 italic">
                      ... y {importResult.errors.length - 10} errores más (ver consola)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

