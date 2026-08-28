import re

with open('src/components/Visualizer.tsx', 'r') as f:
    content = f.read()

# Add WeatherOverlay import and CloudRain icon
content = content.replace(
    "import { GripVertical, ZoomIn, ZoomOut, Trash2, ExternalLink, Info } from 'lucide-react';",
    "import { GripVertical, ZoomIn, ZoomOut, Trash2, ExternalLink, Info, CloudRain, Snowflake } from 'lucide-react';\nimport WeatherOverlay from './WeatherOverlay';"
)

# Add weather state
state_code = """  const [zoom, setZoom] = useState(0.8);
  const [hoveredLayer, setHoveredLayer] = useState<Layer | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Weather state
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [weatherType, setWeatherType] = useState<'rain' | 'snow'>('rain');
  const [weatherIntensity, setWeatherIntensity] = useState(50);
"""
content = content.replace(
    "  const [zoom, setZoom] = useState(0.8);\n  const [hoveredLayer, setHoveredLayer] = useState<Layer | null>(null);\n  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });",
    state_code
)

# Add weather UI controls
weather_ui = """      {/* Weather Controls */}
      <div className="absolute top-6 left-6 bg-bg-panel/90 backdrop-blur-md rounded-lg shadow-sm border border-border-main z-10 p-4 w-72">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-soprema-black text-sm uppercase tracking-wide flex items-center gap-2">
            {weatherType === 'rain' ? <CloudRain className="w-4 h-4 text-soprema-blue" /> : <Snowflake className="w-4 h-4 text-blue-300" />}
            Weather Simulation
          </h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={weatherEnabled} onChange={(e) => setWeatherEnabled(e.target.checked)} />
            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-soprema-blue"></div>
          </label>
        </div>
        
        {weatherEnabled && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-md">
              <button
                onClick={() => setWeatherType('rain')}
                className={`flex-1 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${weatherType === 'rain' ? 'bg-white dark:bg-gray-600 text-soprema-blue shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                Rain
              </button>
              <button
                onClick={() => setWeatherType('snow')}
                className={`flex-1 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${weatherType === 'snow' ? 'bg-white dark:bg-gray-600 text-soprema-blue shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                Snow
              </button>
            </div>
            
            <div>
              <div className="flex justify-between text-xs text-text-muted font-medium mb-1">
                <span>Intensity</span>
                <span>{weatherIntensity}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={weatherIntensity}
                onChange={(e) => setWeatherIntensity(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-soprema-blue dark:bg-gray-700"
              />
            </div>
          </div>
        )}
      </div>
"""

content = content.replace("      {/* Zoom Controls */}", weather_ui + "\n      {/* Zoom Controls */}")

# Render the weather overlay
overlay_jsx = """
  return (
    <div 
      className="w-full h-full relative flex items-center justify-center"
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {weatherEnabled && <WeatherOverlay type={weatherType} intensity={weatherIntensity} />}
      
      {/* Sidebar List */}"""

content = content.replace("  return (\n    <div \n      className=\"w-full h-full relative flex items-center justify-center\"\n      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}\n    >\n      {/* Sidebar List */}", overlay_jsx)


with open('src/components/Visualizer.tsx', 'w') as f:
    f.write(content)

