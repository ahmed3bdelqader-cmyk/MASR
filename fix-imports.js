const fs = require('fs');
const path = require('path');

function replaceInFiles(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            replaceInFiles(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('@/lib/')) {
                // Global replace using regex
                content = content.replace(/@\/lib\//g, '@/core/');
                fs.writeFileSync(fullPath, content);
                console.log('Updated:', fullPath);
            }
        }
    }
}

console.log('Starting replace...');
replaceInFiles('src');
console.log('Done!');
