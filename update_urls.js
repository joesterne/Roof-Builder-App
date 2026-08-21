const fs = require('fs');

const content = fs.readFileSync('./src/data.ts', 'utf8');

const updated = content.replace(/name: '([^']+)'|name: "([^"]+)"/g, (match, p1, p2) => {
  const name = p1 || p2;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const url = `https://soprema.us/products/${slug}`;
  return `${match},\n    productUrl: '${url}'`;
});

fs.writeFileSync('./src/data.ts', updated);
console.log('URLs added!');
