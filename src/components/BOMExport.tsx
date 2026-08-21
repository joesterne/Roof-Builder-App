import React, { useRef, useMemo } from 'react';
import { RoofParams, Layer, BOMItem } from '../types';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface BOMExportProps {
  params: RoofParams;
  layers: Layer[];
}

export default React.memo(function BOMExport({ params, layers }: BOMExportProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const [isExporting, setIsExporting] = React.useState(false);

  const { items, totalCost } = useMemo(() => {
    let totalCost = 0;
    const items: BOMItem[] = [];

    // Convert area to sq ft for material calculation (since materials are in sq ft)
    const baseAreaSqFt = params.unitSystem === 'metric' ? params.area * 10.7639 : params.area;
    const effectiveSqFt = baseAreaSqFt * (1 + params.wasteFactor);
    const pitchMultiplier = Math.sqrt(1 + Math.pow(params.pitch / 12, 2)); // simple pitch length multiplier
    const totalAreaToCover = effectiveSqFt * pitchMultiplier;

    layers.forEach(layer => {
      const mat = layer.material;
      const unitsNeeded = Math.ceil(totalAreaToCover / mat.coveragePerUnit);
      const cost = unitsNeeded * mat.pricePerUnit;
      
      totalCost += cost;
      
      const existing = items.find(i => i.material.id === mat.id);
      if (existing) {
        existing.quantity += unitsNeeded;
        existing.totalCost += cost;
      } else {
        items.push({ material: mat, quantity: unitsNeeded, totalCost: cost });
      }
    });

    return { items, totalCost };
  }, [params.unitSystem, params.area, params.wasteFactor, params.pitch, layers]);

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    const toastId = toast.loading('Generating PDF document...');
    
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Soprema_BOM.pdf');
      toast.success('PDF successfully downloaded!', { id: toastId });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  if (layers.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        Add materials to see the Bill of Materials.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-soprema-black">Bill of Materials</h2>
        <button 
          onClick={handleExportPDF}
          disabled={isExporting}
          className={`flex items-center gap-2 text-white px-4 py-2 rounded-md transition-colors font-medium text-sm ${
            isExporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-soprema-blue hover:bg-blue-700'
          }`}
        >
          <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
          {isExporting ? 'Generating...' : 'Export PDF'}
        </button>
      </div>
      
      {/* Scrollable container for UI, but the print ref wraps the actual content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div 
          ref={printRef} 
          className="bg-white p-8 max-w-3xl mx-auto shadow-sm border border-gray-200"
        >
          <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-soprema-blue mb-1">SOPREMA</h1>
              <p className="text-gray-500 font-medium">Project Bill of Materials</p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p><span className="font-semibold text-gray-900">Size:</span> {params.area || 0} {params.unitSystem === 'metric' ? 'Sq M' : 'Sq Ft'}</p>
              <p><span className="font-semibold text-gray-900">Pitch:</span> {params.pitch || 0}/12</p>
              <p><span className="font-semibold text-gray-900">Waste:</span> {params.wasteFactor * 100}%</p>
              <p><span className="font-semibold text-gray-900">Location:</span> {params.location || 'N/A'}</p>
            </div>
          </div>

          {params.projectNotes && (
            <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Project Notes & Requirements</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{params.projectNotes}</p>
            </div>
          )}

          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="border-b-2 border-gray-300 text-sm uppercase tracking-wider text-gray-500">
                <th className="py-3 px-2 font-semibold">Material</th>
                <th className="py-3 px-2 font-semibold text-right">Quantity</th>
                <th className="py-3 px-2 font-semibold text-right">Unit Price</th>
                <th className="py-3 px-2 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {items.map((item, i) => (
                <tr key={i} className="border-b border-gray-200 last:border-0">
                  <td className="py-3 px-2">
                    <div className="font-semibold">{item.material.name}</div>
                    <div className="text-xs text-gray-500">{item.material.category}</div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    {item.quantity} {item.material.unit}s
                  </td>
                  <td className="py-3 px-2 text-right">
                    ${item.material.pricePerUnit.toFixed(2)}
                  </td>
                  <td className="py-3 px-2 text-right font-medium">
                    ${item.totalCost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end pt-4 border-t-2 border-gray-300">
            <div className="text-right">
              <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">Estimated Total Material Cost</p>
              <p className="text-3xl font-bold text-soprema-blue">${totalCost.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="mt-12 text-xs text-gray-400 text-center">
            * Prices and quantities are estimates based on standard coverage rates. Please consult your Soprema representative for official quoting.
          </div>
        </div>
      </div>
    </div>
  );
});
