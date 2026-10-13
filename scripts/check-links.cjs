const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {validateContent,renderPage} = require('./build-links.cjs');
const folder = path.resolve(__dirname,'../links');
const data = JSON.parse(fs.readFileSync(path.join(folder,'content.json'),'utf8'));
const html = fs.readFileSync(path.join(folder,'index.html'),'utf8');

validateContent(data);
assert.equal(html,renderPage(data),'Run build-links after changing content');
assert.equal((html.match(/<img /g)||[]).length,data.products.length);
assert.equal((html.match(/ sponsored/g)||[]).length,data.products.filter(item=>item.affiliate).length);
assert.ok(html.indexOf('class="affiliate-note"') < html.indexOf('<ul'));
assert.ok(html.indexOf('id="heading-tools"') < html.indexOf('id="heading-free"'));
assert.ok(!/noindex|디자인 시안|무료|theme-toggle|content\.js|준비 중인 링크/.test(html));
for (const item of [...data.products,...data.resources]) {
  assert.ok(html.includes(`href="${item.url}"`));
  assert.ok(html.includes(item.title));
}
for (const item of data.resources) {
  assert.ok(html.includes(`id="resource-${item.number}"`));
  assert.ok(html.includes(`${item.number}번 자료 ${item.title} 자료 받기 (새 창)`));
}
const reversed = structuredClone(data);
reversed.resources.reverse();
assert.equal(renderPage(reversed),html,'Reordering the source cannot renumber resources');
const escaped = structuredClone(data);
escaped.resources[0].title = '<script>alert("x")</script>';
assert.ok(renderPage(escaped).includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'));
for (const update of [
  fixture=>{fixture.resources[1].number=fixture.resources[0].number;},
  fixture=>{fixture.nextResourceNumber=2;},
  fixture=>{fixture.resources[0].url='javascript:alert(1)';},
  fixture=>{fixture.products[0].image='http://example.com/image.png';},
  fixture=>{fixture.products[0].url='https://example.com/not-a-partner-link';}
]) {
  const fixture = structuredClone(data);
  update(fixture);
  assert.throws(()=>validateContent(fixture));
}
const failedImage = {complete:true,naturalWidth:0,hidden:false,nextElementSibling:{hidden:true},addEventListener(){}};
vm.runInNewContext(fs.readFileSync(path.join(folder,'app.js'),'utf8'),{document:{querySelectorAll:()=>[failedImage]}});
assert.equal(failedImage.hidden,true);
assert.equal(failedImage.nextElementSibling.hidden,false);
console.log('PASS: static links, source/output agreement, stable numbers, affiliate disclosure, safe URLs, escaped text and image fallback');
