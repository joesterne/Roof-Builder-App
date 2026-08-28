import re

with open('src/components/Sidebar.tsx', 'r') as f:
    content = f.read()

# Replace Project Statistics
stats_pattern = re.compile(r'<div className="p-6 border-b border-border-main bg-bg-panel-hover">\s*<h2 className="text-lg font-bold text-soprema-black flex items-center gap-2 mb-4">\s*<Calculator className="w-5 h-5 text-soprema-blue" \/>\s*Project Statistics\s*<\/h2>.*?<\/div>\s*<\/div>', re.DOTALL)
stats_replacement = "<ProjectStatistics stats={stats} />"
content = stats_pattern.sub(stats_replacement, content)

# Remove unused recharts imports from Sidebar
recharts_pattern = re.compile(r'import \{ PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend \} from \'recharts\';\n')
content = content.replace("import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';\n", "")

# Add ProjectStatistics import
imports = "import ProjectStatistics from './ProjectStatistics';\n"
content = content.replace("import LocationPicker", imports + "import LocationPicker")

with open('src/components/Sidebar.tsx', 'w') as f:
    f.write(content)
