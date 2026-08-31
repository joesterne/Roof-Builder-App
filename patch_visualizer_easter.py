import re

with open('src/components/Visualizer.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { isValidOrder } from '../utils';",
    "import { isValidOrder } from '../utils';\nimport { useSecretCode } from '../hooks/useSecretCode';"
)

# 2. Update weather type state
content = content.replace(
    "const [weatherType, setWeatherType] = useState<'rain' | 'snow'>('rain');",
    "const [weatherType, setWeatherType] = useState<'rain' | 'snow' | 'cats' | 'party'>('rain');"
)

# 3. Add hooks to the component
hooks_str = """  const [weatherIntensity, setWeatherIntensity] = useState(50);
  const [showWeatherControls, setShowWeatherControls] = useState(false);
  const [weatherDisplayEnabled, setWeatherDisplayEnabled] = useState(false);

  // Easter Eggs
  const isDoABarrelRoll = useSecretCode('barrel');
  const isCatsAndDogs = useSecretCode('meow');
  const isPartyMode = useSecretCode('party');

  useEffect(() => {
    if (isCatsAndDogs) {
      setWeatherType('cats');
      setWeatherDisplayEnabled(true);
    } else if (isPartyMode) {
      setWeatherType('party');
      setWeatherDisplayEnabled(true);
    } else {
      setWeatherType('rain'); // reset
    }
  }, [isCatsAndDogs, isPartyMode]);
"""
content = content.replace(
    "  const [weatherIntensity, setWeatherIntensity] = useState(50);\n  const [showWeatherControls, setShowWeatherControls] = useState(false);\n  const [weatherDisplayEnabled, setWeatherDisplayEnabled] = useState(false);",
    hooks_str
)

# 4. Add the barrel roll effect to the main container
content = content.replace(
    "<div id=\"visualizer-capture\" className=\"w-full h-full min-h-[400px] flex items-center justify-center bg-bg-panel-hover overflow-hidden relative border-b border-border-main\"",
    "<div id=\"visualizer-capture\" className={`w-full h-full min-h-[400px] flex items-center justify-center bg-bg-panel-hover overflow-hidden relative border-b border-border-main transition-transform duration-1000 ${isDoABarrelRoll ? 'rotate-180 scale-50' : ''}`}"
)

# 5. Fix icons for the weather toolbar when in secret mode
icon_old = "{weatherType === 'rain' ? <CloudRain className=\"w-4 h-4\" /> : <Snowflake className=\"w-4 h-4\" />}"
icon_new = "{weatherType === 'cats' ? '🐱' : (weatherType === 'party' ? '🎉' : (weatherType === 'rain' ? <CloudRain className=\"w-4 h-4\" /> : <Snowflake className=\"w-4 h-4\" />))}"
content = content.replace(icon_old, icon_new)

icon_old_2 = "{weatherType === 'rain' ? <CloudRain className=\"w-4 h-4 text-soprema-blue\" /> : <Snowflake className=\"w-4 h-4 text-blue-300\" />}"
icon_new_2 = "{weatherType === 'cats' ? <span className=\"text-sm\">🐱</span> : (weatherType === 'party' ? <span className=\"text-sm\">🎉</span> : (weatherType === 'rain' ? <CloudRain className=\"w-4 h-4 text-soprema-blue\" /> : <Snowflake className=\"w-4 h-4 text-blue-300\" />))}"
content = content.replace(icon_old_2, icon_new_2)

with open('src/components/Visualizer.tsx', 'w') as f:
    f.write(content)
