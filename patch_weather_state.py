import re

with open('src/components/Visualizer.tsx', 'r') as f:
    content = f.read()

target = "  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });"
replacement = """  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [weatherType, setWeatherType] = useState<'rain' | 'snow'>('rain');
  const [weatherIntensity, setWeatherIntensity] = useState(50);"""

content = content.replace(target, replacement)

with open('src/components/Visualizer.tsx', 'w') as f:
    f.write(content)
