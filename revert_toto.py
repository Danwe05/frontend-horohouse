import os

search_dir = r"d:\Reserved\projects\horohouse\web\client"

count = 0
for root, _, files in os.walk(search_dir):
    if "node_modules" in root or ".next" in root:
        continue
    for file in files:
        if file.endswith((".tsx", ".ts", ".css")):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                if "toto" in content:
                    new_content = content.replace("boxtoto", "box")
                    new_content = new_content.replace("texttoto", "text")
                    new_content = new_content.replace("dropToto", "drop")
                    new_content = new_content.replace("toto", "")
                    
                    if new_content != content:
                        with open(filepath, "w", encoding="utf-8") as f:
                            f.write(new_content)
                        count += 1
                        print(f"Fixed 'toto' in {filepath}")
            except Exception as e:
                print(f"Failed on {filepath}: {e}")

print(f"Done. Fixed {count} files.")
