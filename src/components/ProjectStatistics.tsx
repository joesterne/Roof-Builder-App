import React from 'react';
import { Calculator } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface ProjectStatisticsProps {
  stats: {
    totalThickness: number;
    avgRValue: number;
    totalCostPerSqFt: number;
    compositionData: {
      name: string;
      value: number;
      cost: number;
      color: string;
    }[];
  };
  unitSystem: 'imperial' | 'metric';
}

export default function ProjectStatistics({ stats, unitSystem }: ProjectStatisticsProps) {
  const isMetric = unitSystem === 'metric';
  const displayCost = isMetric ? stats.totalCostPerSqFt * 10.7639 : stats.totalCostPerSqFt;
  const displayThickness = isMetric ? (stats.totalThickness * 25.4).toFixed(1) + ' mm' : stats.totalThickness.toFixed(2) + '"';
  const displayRValue = isMetric ? (stats.avgRValue / 5.678).toFixed(2) : stats.avgRValue.toFixed(1);

  return (
    <div className="p-6 border-b border-border-main bg-bg-panel-hover">
      <h2 className="text-lg font-bold text-soprema-black flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-soprema-blue" />
        Project Statistics
      </h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-bg-panel p-3 rounded-md border border-border-main shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-xs text-text-muted font-medium">Est. Cost / {isMetric ? 'Sq M' : 'Sq Ft'}</span>
          <span className="text-lg font-bold text-text-main">${displayCost.toFixed(2)}</span>
        </div>
        <div className="bg-bg-panel p-3 rounded-md border border-border-main shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-xs text-text-muted font-medium">Total Thickness</span>
          <span className="text-lg font-bold text-text-main">{displayThickness}</span>
        </div>
        <div className="col-span-2 bg-bg-panel p-3 rounded-md border border-border-main shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-xs text-text-muted font-medium">Avg Layer {isMetric ? 'RSI' : 'R-Value'}</span>
          <span className="text-lg font-bold text-text-main">{displayRValue}</span>
        </div>
      </div>

      {stats.compositionData.length > 0 && (
        <div className="bg-bg-panel p-3 rounded-md border border-border-main shadow-sm flex flex-col">
          <span className="text-xs text-text-muted font-medium mb-2 text-center">Cost Composition</span>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.compositionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="cost"
                >
                  {stats.compositionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-main)', color: 'var(--text-main)', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: 'var(--text-main)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
