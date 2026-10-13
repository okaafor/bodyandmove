const fs = require('node:fs');
const path = require('node:path');

const folder = path.resolve(__dirname, '../links');
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function validateContent(data) {
  if (!Array.isArray(data.products) || !Array.isArray(data.resources)) throw Error('products and resources must be arrays');
  const ids = new Set();
  function https(value) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) throw Error('Links must be HTTPS URLs without credentials');
  }
  for (const item of [...data.products, ...data.resources]) {
    if (typeof item.id !== 'string' || !/^[a-z0-9-]+$/.test(item.id) || ids.has(item.id)) throw Error('IDs must be unique lowercase slugs');
    ids.add(item.id);
    if (typeof item.title !== 'string' || !item.title.trim()) throw Error('Every item needs a title');
    if (item.description !== undefined && typeof item.description !== 'string') throw Error('Descriptions must be text');
    https(item.url);
  }
  for (const item of data.products) {
    if (item.image) https(item.image);
    if (item.affiliate && item.affiliate !== 'coupang') throw Error('Unknown affiliate provider');
    if (item.affiliate === 'coupang' && new URL(item.url).hostname !== 'link.coupang.com') throw Error('Coupang items need the generated partner link');
  }
  const numbers = data.resources.map(item => item.number);
  if (numbers.some(number => !Number.isSafeInteger(number) || number < 1) || new Set(numbers).size !== numbers.length) throw Error('Resource numbers must be unique positive integers');
  if (!Number.isSafeInteger(data.nextResourceNumber) || data.nextResourceNumber < 1 || numbers.some(number => number >= data.nextResourceNumber)) throw Error('nextResourceNumber must be greater than all assigned numbers');
}

function renderPage(data) {
  validateContent(data);
  const productRows = data.products.map(item => {
    const image = item.image ? `<span class="product-thumb"><img class="product-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)} 상품 사진" width="80" height="80" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="image-fallback" hidden>이미지 준비 중</span></span>` : '';
    return `<li><a class="link-row is-active${item.image ? ' has-image' : ''}" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer${item.affiliate ? ' sponsored' : ''}" aria-label="${escapeHtml(item.title)} 상품 보기 (새 창)">${image}<div class="link-copy"><h3>${escapeHtml(item.title)}</h3>${item.description ? `<p class="link-description">${escapeHtml(item.description)}</p>` : ''}</div><span class="link-action">${item.affiliate === 'coupang' ? '쿠팡에서 보기' : '상품 보기'} <span class="action-arrow" aria-hidden="true">↗</span></span></a></li>`;
  }).join('\n');
  const resourceRows = [...data.resources].sort((a,b) => a.number - b.number).map(item => `<li id="resource-${item.number}"><a class="link-row resource-row is-active" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="${item.number}번 자료 ${escapeHtml(item.title)} 자료 받기 (새 창)"><span class="resource-number">${item.number}<span class="sr-only">번 자료</span></span><div class="link-copy"><h3>${escapeHtml(item.title)}</h3>${item.description ? `<p class="link-description">${escapeHtml(item.description)}</p>` : ''}</div><span class="link-action">자료 받기 <span class="action-arrow" aria-hidden="true">↓</span></span></a></li>`).join('\n');
  const disclosure = data.products.some(item => item.affiliate === 'coupang') ? '<p class="affiliate-note">이 페이지는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>' : '';
  const products = data.products.length ? `<section class="link-section" aria-labelledby="heading-tools"><div class="section-heading"><h2 id="heading-tools">추천 상품</h2><span class="count">${data.products.length}</span></div>${disclosure}<ul class="link-list">${productRows}</ul></section>` : '';
  const resources = data.resources.length ? `<section class="link-section" aria-labelledby="heading-free"><div class="section-heading"><h2 id="heading-free">자료</h2><span class="count">${data.resources.length}</span></div><ul class="link-list resource-list">${resourceRows}</ul></section>` : '';
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f6f7f9">
  <title>추천 상품과 자료 | 바디앤무브</title>
  <meta name="description" content="바디앤무브의 추천 도구와 요가 학습 자료를 한곳에서 만나보세요.">
  <meta property="og:type" content="website">
  <meta property="og:title" content="추천 상품과 자료 | 바디앤무브">
  <meta property="og:description" content="영상 속 추천 도구와 요가 학습 자료를 한곳에서.">
  <link rel="canonical" href="https://www.bodyandmove.co.kr/links/">
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="styles.css">
  <script src="app.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#library">링크 목록으로 건너뛰기</a>
  <div class="page-shell">
    <header class="topbar">
      <h1>바디앤무브</h1>
      <a class="header-visit" href="https://naver.me/xg7mE0XM" target="_blank" rel="noopener noreferrer" aria-label="바디앤무브 컨디셔닝 마사지 이완 케어 네이버 예약 (새 창)"><span><strong>바디앤무브에서 만나요</strong><span class="visit-caption">컨디셔닝 마사지 이완 케어</span></span><span class="visit-arrow" aria-hidden="true">↗</span></a>
    </header>
    <main id="library">
      ${products}
      ${resources}
    </main>
    <footer>
      <nav class="social-links" aria-label="바디앤무브 채널">
        <a href="https://instagram.com/body_and_move" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
        <a href="https://youtube.com/@바디앤무브" target="_blank" rel="noopener noreferrer">YouTube ↗</a>
      </nav>
    </footer>
  </div>
</body>
</html>
`;
}

if (require.main === module) {
  const content = JSON.parse(fs.readFileSync(path.join(folder, 'content.json'), 'utf8'));
  const html = renderPage(content);
  fs.writeFileSync(path.join(folder, 'index.html'), html, 'utf8');
  console.log(`Built /links/: ${content.products.length} products, ${content.resources.length} resources`);
}
module.exports = {validateContent, renderPage};
