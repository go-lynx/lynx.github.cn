#!/bin/bash

# Manual sync script for lynx.github.cn
# Usage: ./scripts/manual-sync.sh [version]
# Example: ./scripts/manual-sync.sh v1.2.3

set -e

VERSION=${1:-$(curl -s https://api.github.com/repos/go-lynx/lynx/releases/latest | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')}

echo "🔄 Starting manual sync for version: $VERSION"

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
echo "📁 Created temporary directory: $TEMP_DIR"

# Clone the main lynx repository
echo "📥 Cloning main lynx repository..."
git clone --depth 1 --branch $VERSION https://github.com/go-lynx/lynx.git $TEMP_DIR/lynx-main

# Check if release notes exist
RELEASE_NOTES_FILE="$TEMP_DIR/lynx-main/RELEASE_NOTES_${VERSION}.md"
if [ -f "$RELEASE_NOTES_FILE" ]; then
    echo "📋 Found release notes for $VERSION"
    
    # Create blog post directory
    BLOG_DATE=$(date +%Y-%m-%d)
    BLOG_DIR="blog/${BLOG_DATE}-release-${VERSION}"
    mkdir -p "$BLOG_DIR"
    
    # Create blog post
    cat > "$BLOG_DIR/index.md" << EOF
---
slug: release-${VERSION}
title: Lynx ${VERSION} 发布
authors: [lynx-team]
tags: [release, ${VERSION}]
---

# Lynx ${VERSION} 发布说明

$(cat "$RELEASE_NOTES_FILE")
EOF

    echo "✅ Created blog post: $BLOG_DIR/index.md"
else
    echo "⚠️  No release notes found for $VERSION"
fi

# Check for any specific documentation updates needed
echo "🔍 Checking for documentation updates..."

# Example: Check if there are any breaking changes that need documentation updates
if grep -q "BREAKING" "$TEMP_DIR/lynx-main/RELEASE_NOTES_${VERSION}.md" 2>/dev/null; then
    echo "⚠️  Breaking changes detected in $VERSION - manual review recommended"
fi

# Clean up
echo "🧹 Cleaning up temporary files..."
rm -rf $TEMP_DIR

echo "✨ Manual sync completed for version: $VERSION"
echo "🚀 Next steps:"
echo "   1. Review any changes made"
echo "   2. Commit and push changes: git add . && git commit -m 'docs: sync for $VERSION' && git push"
echo "   3. Deploy documentation: npm run build && npm run deploy"