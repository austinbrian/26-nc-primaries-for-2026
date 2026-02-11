#!/bin/bash

# Rebuild wordpress-embed.html with current settings
# Usage: ./build-wordpress.sh [github-username]
#
# The WordPress embed loads races.json from GitHub raw content.
# Update your username or edit DATA_URL below.

USERNAME="${1:-austinbrian}"
DATA_URL="https://raw.githubusercontent.com/$USERNAME/matchup-guide/main/races.json"

echo "Building WordPress embed..."
echo "GitHub username: $USERNAME"
echo "Data URL: $DATA_URL"

# Update the DATA_URL in wordpress-embed.html
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s|const DATA_URL = '.*'|const DATA_URL = '$DATA_URL'|g" wordpress-embed.html
else
  # Linux
  sed -i "s|const DATA_URL = '.*'|const DATA_URL = '$DATA_URL'|g" wordpress-embed.html
fi

echo "Updated wordpress-embed.html"
echo ""
echo "Next steps:"
echo "1. git add -A && git commit -m 'Update WordPress embed'"
echo "2. git push"
echo "3. Copy contents of wordpress-embed.html into WordPress Custom HTML block"
