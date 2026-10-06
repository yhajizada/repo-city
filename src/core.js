(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RepoCityCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TYPES = {
    typescript: { label: 'TypeScript', color: '#82b9ee', extensions: ['ts','tsx'] },
    javascript: { label: 'JavaScript', color: '#f2d078', extensions: ['js','jsx','mjs','cjs'] },
    styles: { label: 'Styles', color: '#b5a0e6', extensions: ['css','scss','sass','less'] },
    python: { label: 'Python', color: '#8acbbd', extensions: ['py','ipynb'] },
    markup: { label: 'Markup', color: '#e5a48c', extensions: ['html','vue','svelte','xml'] },
    data: { label: 'Data & config', color: '#a7d38b', extensions: ['json','yaml','yml','toml','ini','lock'] },
    docs: { label: 'Docs', color: '#aab6c8', extensions: ['md','mdx','txt','rst','pdf'] },
    assets: { label: 'Assets', color: '#d99abf', extensions: ['png','jpg','jpeg','svg','gif','webp','ico','woff','woff2','ttf','mp4','mp3'] },
    other: { label: 'Other', color: '#99a7ad', extensions: [] }
  };
  const SKIP = new Set(['node_modules','.git','.svn','.hg','.next','.nuxt','.cache','__pycache__','.venv','venv','vendor','coverage','dist','build','target']);
  function hash(value) { let h = 2166136261; for (const char of String(value)) { h ^= char.charCodeAt(0); h = Math.imul(h,16777619); } return h >>> 0; }
  function typeOf(name) { const extension = name.split('.').pop().toLowerCase(); return Object.keys(TYPES).find(key => TYPES[key].extensions.includes(extension)) || 'other'; }
  function formatBytes(bytes) { if (bytes < 1024) return `${Math.round(bytes)} B`; if (bytes < 1048576) return `${(bytes/1024).toFixed(bytes < 10240 ? 1 : 0)} KB`; if (bytes < 1073741824) return `${(bytes/1048576).toFixed(1)} MB`; return `${(bytes/1073741824).toFixed(1)} GB`; }
  function normalizeFiles(records, limit = 1600) {
    const accepted = [], seen = new Set(); let skipped = 0;
    for (const file of records) {
      const raw = String(file.path || file.webkitRelativePath || file.name || '').replace(/\\/g,'/');
      const parts = raw.split('/').filter(Boolean);
      const name = parts.at(-1) || '';
      const canonical = parts.join('/');
      if (!parts.length || parts.includes('..') || parts.some(part => SKIP.has(part)) || /^\.env(?:\.|$)/i.test(name) || seen.has(canonical) || !Number.isFinite(file.size) || file.size < 0) { skipped++; continue; }
      seen.add(canonical); accepted.push({ path: canonical, name, size: file.size, type: typeOf(name) });
    }
    accepted.sort((a,b) => a.path.localeCompare(b.path, 'en'));
    return { files: accepted.slice(0,limit), skipped, omitted: Math.max(0,accepted.length-limit), eligible: accepted.length };
  }
  function layout(files) {
    const groups = new Map();
    for (const file of files) { const parts = file.path.split('/'); const group = parts.length > 2 ? parts[1] : 'root'; if (!groups.has(group)) groups.set(group,[]); groups.get(group).push(file); }
    const sorted = [...groups].sort((a,b) => b[1].length-a[1].length || a[0].localeCompare(b[0]));
    const totalArea = sorted.reduce((sum,[,items]) => sum + (Math.ceil(Math.sqrt(items.length))+3)**2,0);
    const rowWidth = Math.max(14,Math.ceil(Math.sqrt(totalArea)*1.25));
    const districts = [], buildings = []; let x = 0, y = 0, rowHeight = 0;
    sorted.forEach(([name,items], index) => {
      const cols = Math.max(2,Math.ceil(Math.sqrt(items.length))), rows = Math.ceil(items.length/cols);
      const width = cols+2, depth = rows+2;
      if (x && x+width > rowWidth) { x = 0; y += rowHeight+2; rowHeight = 0; }
      const district = { name, x, y, width, depth, index, count: items.length };
      districts.push(district);
      items.forEach((file,i) => buildings.push({ ...file, district: name, districtIndex: index, x: x+1+i%cols, y: y+1+Math.floor(i/cols), height: Math.min(180,16+Math.log2(file.size/160+1)*13), footprint: .64+(hash(file.path)%10)/100, id: buildings.length }));
      x += width+2; rowHeight = Math.max(rowHeight,depth);
    });
    return { buildings, districts };
  }
  function demoFiles() {
    const records = [];
    const folders = { src: ['App.tsx','main.tsx','router.ts','store.ts','theme.css','globals.css'], components: ['Button.tsx','Dialog.tsx','Card.tsx','Header.tsx','Sidebar.tsx','Menu.tsx','Tooltip.tsx','Avatar.tsx','Badge.tsx','Input.tsx','Select.tsx','Table.tsx'], pages: ['Home.tsx','Projects.tsx','Settings.tsx','Profile.tsx','Activity.tsx','Explore.tsx','Search.tsx'], hooks: ['useTheme.ts','useProjects.ts','useKeyboard.ts','useStorage.ts','useWindow.ts'], api: ['client.ts','auth.ts','projects.ts','users.ts','schema.json'], styles: ['layout.css','tokens.css','components.scss','animations.css','responsive.css'], test: ['app.test.ts','router.test.ts','projects.test.ts','auth.test.ts','fixtures.json'], public: ['icon.svg','logo.svg','hero.webp','avatar.png','inter.woff2'], docs: ['README.md','architecture.md','setup.md','api.md','contributing.md'] };
    for (const [folder,names] of Object.entries(folders)) {
      for (const name of names) { const copies = ['components','pages','src'].includes(folder) ? 2 : 1; for (let n=0;n<copies;n++) { const p = `orbit-studio/${folder}/${n ? 'shared/' : ''}${name}`; records.push({path:p,size: 280+(hash(p)%70000)}); } }
    }
    for (const name of ['package.json','tsconfig.json','vite.config.ts','README.md','.gitignore','LICENSE']) records.push({path:`orbit-studio/${name}`,size:300+hash(name)%3000});
    return normalizeFiles(records).files;
  }
  function pointInPolygon(point, polygon) {
    let inside = false;
    for (let i=0,j=polygon.length-1;i<polygon.length;j=i++) { const a=polygon[i],b=polygon[j]; if ((a.y>point.y)!==(b.y>point.y) && point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x) inside = !inside; }
    return inside;
  }
  return { TYPES, SKIP, hash, typeOf, formatBytes, normalizeFiles, layout, demoFiles, pointInPolygon };
});
