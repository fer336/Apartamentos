import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Trash2, Edit2, X } from 'lucide-react';
import Papa from 'papaparse';
import { KanagawaCard } from '../components/ui/KanagawaCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

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
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-11 h-11 rounded-md bg-surface border border-border-subtle hover:bg-surface-hover flex items-center justify-center transition-colors duration-fast ease-kanagawa flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-primary" strokeWidth={1.7} />
          </button>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-ink-primary flex items-center gap-3">
              <FileSpreadsheet className="w-7 h-7 md:w-8 md:h-8 text-primary" strokeWidth={1.7} />
              Importar / Exportar
            </h1>
            <p className="text-ink-secondary mt-1 text-sm">Carga masiva de reservas desde CSV</p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {parsedData.length > 0 && (
            <Button variant="danger" onClick={handleClear} className="flex-1 md:flex-none">
              <X className="w-4 h-4" strokeWidth={1.7} />
              <span className="hidden sm:inline">Limpiar</span>
            </Button>
          )}
          <button
            onClick={handleExport}
            className="flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-md font-semibold flex items-center justify-center gap-2 transition-colors duration-fast ease-kanagawa"
            style={{ background: 'color-mix(in srgb, var(--green) 16%, transparent)', color: 'var(--green-strong)', border: '1px solid color-mix(in srgb, var(--green) 28%, transparent)' }}
          >
            <Download className="w-4 h-4" strokeWidth={1.7} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="upload-zone p-12 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <div className="w-16 h-16 mx-auto rounded-full bg-surface-violet flex items-center justify-center mb-4">
          <Upload className="w-8 h-8 text-primary" strokeWidth={1.7} />
        </div>
        <h3 className="font-display text-xl font-bold text-ink-primary mb-2">
          {file ? file.name : 'Selecciona un archivo CSV'}
        </h3>
        <p className="text-ink-secondary font-medium mb-4">
          Arrastra y suelta o haz clic para seleccionar
        </p>
        <p className="text-xs text-ink-muted font-mono">
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
        <KanagawaCard padded={false} className="overflow-hidden">
          <div className="p-6 border-b border-border-subtle bg-background-alt flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-display text-lg font-bold text-ink-primary flex items-center gap-2">
                Vista Preliminar
              </h3>
              <p className="text-sm text-ink-secondary mt-1">
                <span className="text-state-green-strong font-bold">{validCount} válidas</span>
                {errorCount > 0 && <span className="text-state-red font-bold ml-2">{errorCount} con errores</span>}
              </p>
            </div>
            <Button variant="primary" onClick={handleImport} disabled={importing || validCount === 0}>
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" strokeWidth={1.7} />
                  Importar {validCount}
                </>
              )}
            </Button>
          </div>

          {/* Mobile View - Cards */}
          <div className="block lg:hidden divide-y divide-border-subtle max-h-[600px] overflow-y-auto">
            {parsedData.map((booking, index) => (
              <div key={booking.id} className={`p-4 ${booking.errors.length > 0 ? 'bg-state-red/6' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    {editingIndex === index ? (
                      <input
                        type="text"
                        value={booking.clientName}
                        onChange={(e) => handleEdit(index, 'clientName', e.target.value)}
                        className="form-control w-full px-3 py-2 font-bold focus:outline-none"
                      />
                    ) : (
                      <div className="font-bold text-ink-primary">{booking.clientName}</div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                      className="w-8 h-8 rounded-lg bg-surface-violet text-primary flex items-center justify-center hover:bg-surface-hover transition-colors duration-fast ease-kanagawa"
                    >
                      <Edit2 className="w-4 h-4" strokeWidth={1.7} />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="w-8 h-8 rounded-lg bg-state-red/10 text-state-red flex items-center justify-center hover:bg-state-red/16 transition-colors duration-fast ease-kanagawa"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.7} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-ink-muted font-bold">Check-in:</span>
                    <div className="font-bold text-ink-primary">{booking.checkIn || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-ink-muted font-bold">Check-out:</span>
                    <div className="font-bold text-ink-primary">{booking.checkOut || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-ink-muted font-bold">Precio:</span>
                    <div className="font-bold text-ink-primary">{booking.currency} {booking.price.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-ink-muted font-bold">Depósito:</span>
                    <div className="font-bold text-ink-primary">{booking.depositCurrency} {booking.deposit.toLocaleString()}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-ink-muted font-bold">Por Pagar:</span>
                    <div className="font-bold text-state-red">{booking.leftToPayCurrency} {booking.leftToPay.toLocaleString()}</div>
                  </div>
                </div>

                {booking.errors.length > 0 && (
                  <div className="bg-state-red/10 rounded-lg p-2 mt-2">
                    {booking.errors.map((error, i) => (
                      <div key={i} className="text-[10px] text-state-red font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" strokeWidth={1.7} /> {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden lg:block overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-background-alt backdrop-blur">
                <tr>
                  <th className="table-head-cell px-6 py-4">Cliente</th>
                  <th className="table-head-cell px-6 py-4">Check-in</th>
                  <th className="table-head-cell px-6 py-4">Check-out</th>
                  <th className="table-head-cell px-6 py-4">Precio</th>
                  <th className="table-head-cell px-6 py-4">Depósito</th>
                  <th className="table-head-cell px-6 py-4">Por Pagar</th>
                  <th className="table-head-cell px-6 py-4">Estado</th>
                  <th className="table-head-cell px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.map((booking, index) => (
                  <tr key={booking.id} className={`table-row ${booking.errors.length > 0 ? 'bg-state-red/6' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-ink-primary">{booking.clientName}</div>
                      {booking.errors.length > 0 && (
                        <div className="text-[10px] text-state-red font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" strokeWidth={1.7} /> {booking.errors[0]}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-ink-secondary">{booking.checkIn || 'N/A'}</td>
                    <td className="px-6 py-4 text-ink-secondary">{booking.checkOut || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold text-ink-primary">{booking.currency} {booking.price.toLocaleString()}</td>
                    <td className="px-6 py-4 text-ink-secondary">{booking.depositCurrency} {booking.deposit.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-state-red">{booking.leftToPayCurrency} {booking.leftToPay.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {booking.errors.length === 0 ? (
                        <Badge tone="green">
                          <CheckCircle className="w-3 h-3" strokeWidth={1.7} /> Válido
                        </Badge>
                      ) : (
                        <Badge tone="red">
                          <AlertCircle className="w-3 h-3" strokeWidth={1.7} /> Error
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(index)}
                        className="w-8 h-8 rounded-lg bg-state-red/10 text-state-red flex items-center justify-center hover:bg-state-red/16 transition-colors duration-fast ease-kanagawa"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.7} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </KanagawaCard>
      )}

      {/* Import Result */}
      {importResult && (
        <div className={`rounded-2xl p-6 border ${importResult.success > 0 ? 'bg-state-green/10 border-state-green/28' : 'bg-state-red/10 border-state-red/28'}`}>
          <div className="flex items-start gap-3">
            {importResult.success > 0 ? (
              <CheckCircle className="w-8 h-8 text-state-green-strong shrink-0" strokeWidth={1.7} />
            ) : (
              <AlertCircle className="w-8 h-8 text-state-red shrink-0" strokeWidth={1.7} />
            )}
            <div className="flex-1">
              <h4 className={`font-display text-lg font-bold ${importResult.success > 0 ? 'text-state-green-strong' : 'text-state-red'}`}>
                {importResult.success > 0 ? 'Importación Completada' : 'Error en Importación'}
              </h4>
              <p className={`text-sm font-medium mt-1 ${importResult.success > 0 ? 'text-state-green-strong' : 'text-state-red'}`}>
                {importResult.success} reservas importadas exitosamente
                {importResult.failed > 0 && `, ${importResult.failed} fallidas`}
              </p>

              {/* Mostrar errores si existen */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  <p className="text-xs font-bold text-state-red uppercase">Errores detallados:</p>
                  {importResult.errors.slice(0, 10).map((error: string, index: number) => (
                    <div key={index} className="text-xs text-state-red bg-surface rounded-lg p-2 font-mono">
                      {error}
                    </div>
                  ))}
                  {importResult.errors.length > 10 && (
                    <p className="text-xs text-state-red/80 italic">
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
