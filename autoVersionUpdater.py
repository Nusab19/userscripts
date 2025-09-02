import os
from datetime import datetime

root_dir = "."  # change if needed

for dirpath, _, filenames in os.walk(root_dir):
    for filename in filenames:
        if filename.endswith(".user.js"):
            filepath = os.path.join(dirpath, filename)
            mtime = os.path.getmtime(filepath)
            version_date = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d")

            with open(filepath, "r", encoding="utf-8") as f:
                lines = f.readlines()

            new_lines = []
            version_found = False
            for line in lines:
                if line.strip().startswith("// @version"):
                    new_lines.append(f"// @version      {version_date}\n")
                    version_found = True
                else:
                    new_lines.append(line)

            if not version_found:
                new_lines.insert(0, f"// @version      {version_date}\n")

            with open(filepath, "w", encoding="utf-8") as f:
                f.writelines(new_lines)

            print(f"Updated: {filepath} -> {version_date}")
