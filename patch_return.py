import re

with open('src/components/Visualizer.tsx', 'r') as f:
    content = f.read()

target = """  return (
    <div id="visualizer-capture" className="w-full h-full min-h-[400px] flex items-center justify-center bg-bg-panel-hover overflow-hidden relative border-b border-border-main">
      
      {/* Drag and Drop Panel */}"""

replacement = """  return (
    <div id="visualizer-capture" className="w-full h-full min-h-[400px] flex items-center justify-center bg-bg-panel-hover overflow-hidden relative border-b border-border-main" onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
      
      {weatherEnabled && <WeatherOverlay type={weatherType} intensity={weatherIntensity} />}
      
      {/* Drag and Drop Panel */}"""

content = content.replace(target, replacement)

# also fix the position of weather panel since left-6 top-6 is already used by Drag and Drop Panel
# let's change Drag and Drop Panel to bottom or change weather panel to something else.
# Drag and drop panel is currently: left-6 top-6.
# Weather UI was injected before zoom controls. Let's fix Weather UI position to be left-6 top-[something] or absolute top-6 right-32 

with open('src/components/Visualizer.tsx', 'w') as f:
    f.write(content)
