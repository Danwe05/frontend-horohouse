import os

filepath = r"d:\Reserved\projects\horohouse\web\client\app\students\roommates\components\RoommateCard.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
labels_lines = []

for i, line in enumerate(lines):
    if 60 <= i <= 82:
        # indent by 2 spaces
        labels_lines.append("  " + line if line.strip() else line)
        continue
    
    new_lines.append(line)
    
    if "const s = _t.students?.roommates?.card || {};" in line:
        for l in labels_lines:
            new_lines.append(l)

with open(filepath, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Fixed RoommateCard.tsx")
