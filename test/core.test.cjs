const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');

test('dependencies, generated output, environment files and invalid paths are excluded', () => {
  const result = C.normalizeFiles(['repo/src/app.ts','repo/node_modules/pkg/a.js','repo/.git/config','repo/dist/app.js','repo/.env','repo/.env.local','repo/a/../secret.txt'].map(path => ({path,size:100})));
  assert.equal(result.files.length,1);assert.equal(result.skipped,6);assert.equal(result.files[0].type,'typescript');
});
test('normalization handles Windows paths, duplicates, bad sizes and limits', () => {
  const result = C.normalizeFiles([{path:'repo\\src\\a.ts',size:10},{path:'repo/src/a.ts',size:10},{path:'repo/src/b.ts',size:20},{path:'repo/src/c.ts',size:30},{path:'repo/src/bad.ts',size:NaN}],2);
  assert.equal(result.files.length,2);assert.equal(result.skipped,2);assert.equal(result.omitted,1);assert.equal(result.eligible,3);
});
test('layout keeps each building inside a distinct district and has stable IDs', () => {
  const files = C.demoFiles(),city=C.layout(files),again=C.layout(files);
  assert.deepEqual(city,again);assert.equal(city.buildings.length,files.length);
  assert.equal(new Set(city.buildings.map(b=>b.id)).size,files.length);
  for(const b of city.buildings){const d=city.districts[b.districtIndex];assert.ok(b.x>d.x&&b.x+b.footprint<d.x+d.width);assert.ok(b.y>d.y&&b.y+b.footprint<d.y+d.depth);assert.ok(b.height>=16&&b.height<=180);}
  for(let i=0;i<city.districts.length;i++)for(let j=i+1;j<city.districts.length;j++){const a=city.districts[i],b=city.districts[j];assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.depth<=b.y||b.y+b.depth<=a.y);}
});
test('metadata normalization never reads file contents', () => {
  const file={name:'a.ts',webkitRelativePath:'repo/src/a.ts',size:123,text(){throw Error('must not read');},arrayBuffer(){throw Error('must not read');}};
  const result=C.normalizeFiles([file]);assert.equal(result.files[0].size,123);assert.equal(result.files[0].path,'repo/src/a.ts');
});
test('empty folders produce an empty city',()=>assert.deepEqual(C.layout([]),{buildings:[],districts:[]}));
test('building hit detection works for an isometric diamond',()=>{const diamond=[{x:0,y:10},{x:20,y:0},{x:40,y:10},{x:20,y:20}];assert.equal(C.pointInPolygon({x:20,y:10},diamond),true);assert.equal(C.pointInPolygon({x:39,y:1},diamond),false);});
test('extension classification and byte formatting handle common inputs',()=>{assert.equal(C.typeOf('APP.TSX'),'typescript');assert.equal(C.typeOf('theme.scss'),'styles');assert.equal(C.typeOf('LICENSE'),'other');assert.equal(C.formatBytes(0),'0 B');assert.equal(C.formatBytes(1536),'1.5 KB');assert.equal(C.formatBytes(1048576),'1.0 MB');});
