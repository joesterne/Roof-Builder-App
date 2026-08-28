import re

with open('src/components/Visualizer.tsx', 'r') as f:
    content = f.read()

# 1. Update states
content = content.replace(
    "const [weatherEnabled, setWeatherEnabled] = useState(false);",
    "const [showWeatherControls, setShowWeatherControls] = useState(false);\n  const [weatherDisplayEnabled, setWeatherDisplayEnabled] = useState(false);"
)

# 2. Update Overlay condition
content = content.replace(
    "{weatherEnabled && <WeatherOverlay type={weatherType} intensity={weatherIntensity} />}",
    "{weatherDisplayEnabled && <WeatherOverlay type={weatherType} intensity={weatherIntensity} />}"
)

# 3. Update Weather Controls checkbox
content = content.replace(
    "checked={weatherEnabled} onChange={(e) => setWeatherEnabled(e.target.checked)}",
    "checked={showWeatherControls} onChange={(e) => setShowWeatherControls(e.target.checked)}"
)

# 4. Update the condition that hides the sliders
content = content.replace(
    "{weatherEnabled && (",
    "{showWeatherControls && ("
)

# 5. Add the 'Weather Display' toggle to the Zoom Controls toolbar
zoom_controls_old = """      {/* Zoom Controls */}
      <div className="absolute top-6 right-6 bg-bg-panel/90 backdrop-blur-md rounded-lg shadow-sm border border-border-main flex items-center z-10 p-1">"""

zoom_controls_new = """      {/* Visualizer Header Toolbar */}
      <div className="absolute top-6 right-6 bg-bg-panel/90 backdrop-blur-md rounded-lg shadow-sm border border-border-main flex items-center z-10 p-1">
        <button 
          onClick={() => setWeatherDisplayEnabled(!weatherDisplayEnabled)}
          className={`p-1.5 rounded-md transition-colors flex items-center gap-1.5 px-2 text-xs font-bold uppercase tracking-wider ${weatherDisplayEnabled ? 'bg-soprema-blue text-white' : 'text-text-secondary hover:bg-bg-page'}`}
          title="Toggle Weather Display"
        >
          {weatherType === 'rain' ? <CloudRain className="w-4 h-4" /> : <Snowflake className="w-4 h-4" />}
          Weather
        </button>
        <div className="w-px h-5 bg-border-main mx-1"></div>"""

content = content.replace(zoom_controls_old, zoom_controls_new)

with open('src/components/Visualizer.tsx', 'w') as f:
    f.write(content)
