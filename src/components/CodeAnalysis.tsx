import React, { useState, useEffect } from 'react';
import { Layer, RoofParams, CodeAnalysis as CodeAnalysisType } from '../types';
import { ShieldCheck, AlertTriangle, Leaf, Loader2 } from 'lucide-react';

interface CodeAnalysisProps {
  layers: Layer[];
  params: RoofParams;
}

export default React.memo(function CodeAnalysis({ layers, params }: CodeAnalysisProps) {
  const [analysis, setAnalysis] = useState<CodeAnalysisType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAnalysis = async () => {
    if (!params.location || layers.length === 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      const materials = layers.map(l => ({
        name: l.material.name,
        category: l.material.category
      }));
      
      const res = await fetch('/api/analyze-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: params.location, materials })
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch analysis');
      }
      
      const data = await res.json();
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only run if we have a location and materials
    if (params.location && params.location.length > 2 && layers.length > 0) {
      const timer = setTimeout(() => {
        fetchAnalysis();
      }, 1000); // debounce
      return () => clearTimeout(timer);
    } else {
      setAnalysis(null);
    }
  }, [params.location, layers]);

  if (!params.location) {
    return (
      <div className="p-8 text-center text-gray-500">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
        <p>Please enter a location in Project Parameters to view local code requirements and material definitions.</p>
      </div>
    );
  }

  if (layers.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Add materials to the assembly to generate analysis.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-soprema-blue">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-sm font-medium">Analyzing local building codes and materials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p>Error: {error}</p>
        <button onClick={fetchAnalysis} className="mt-4 px-4 py-2 border border-red-500 rounded hover:bg-red-50">Retry</button>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="p-6 overflow-y-auto h-full bg-white text-gray-800">
      <div className="mb-8">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-3 text-soprema-black border-b border-gray-200 pb-2">
          <ShieldCheck className="w-5 h-5 text-soprema-blue" />
          System Overview & Local Regulations ({params.location})
        </h3>
        <p className="text-sm leading-relaxed mb-4 text-gray-700">{analysis.systemOverview}</p>
        
        <h4 className="font-semibold text-sm mb-2 text-gray-900">Key Considerations:</h4>
        <ul className="space-y-2">
          {analysis.localRegulations.map((reg, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100">
              <span className="text-soprema-blue mt-0.5">•</span>
              <span>{reg}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-soprema-black border-b border-gray-200 pb-2">
          <Leaf className="w-5 h-5 text-soprema-green" />
          Material Definitions & Environmental Impact
        </h3>
        
        <div className="space-y-4">
          {analysis.materialDefinitions.map((def, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-bold text-soprema-blue mb-1">{def.material}</h4>
              <p className="text-sm text-gray-700 mb-2"><span className="font-semibold text-gray-900">Definition:</span> {def.description}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold text-gray-900">Environmental Impact:</span> {def.environmentalImpact}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
