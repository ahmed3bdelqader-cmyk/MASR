const fs = require('fs');

const files = [
    'e:/STAND-EG/src/app/employees/page.tsx',
    'e:/STAND-EG/src/app/suppliers/page.tsx',
    'e:/STAND-EG/src/app/purchases/page.tsx'
];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');

    // Find style={{ ... }} and remove it. Keep classes and structure.
    content = content.replace(/style=\{\{.*?\}\}/g, '');

    fs.writeFileSync(f, content);
});
console.log('Inline styles removed successfully.');
