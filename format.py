"""
This script isn't meant to be ran in production. It's just a simpler handy script for me to format everything at once.

I just use `py fo` and `tab` to autocomplite. So, `py format.py` and enter.

"""

import os

# import subprocess

# subprocess.run([r"npx", "-y", "prettier", ".", "--write"], check=True)
os.system("npx -y prettier . --write")
