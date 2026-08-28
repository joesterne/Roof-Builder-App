import re

with open('src/components/Sidebar.tsx', 'r') as f:
    content = f.read()

# Replace the stray recharts section
recharts_stray = re.compile(r'<ProjectStatistics stats=\{stats\} \/>.*?\{stats\.compositionData\.length > 0 && \(.*?<\/div>\s*<\/div>\s*\)\}\s*<\/div>', re.DOTALL)
content = recharts_stray.sub('<ProjectStatistics stats={stats} />', content)

with open('src/components/Sidebar.tsx', 'w') as f:
    f.write(content)
