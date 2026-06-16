import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { site } from '../src/data/site.js';
import { services, priceRows } from '../src/data/services.js';
import { faqs } from '../src/data/faq.js';
import { columns, columnCategories } from '../src/data/columns.js';
import { works } from '../src/data/works.js';

const pages = [];

const esc = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const absolute = (path) => new URL(path.replace(/^\//, ''), site.url).toString();
const button = (href, label, variant = 'primary') => `<a class="button button--${variant}" href="${href}">${label}</a>`;
const sectionTitle = (eyebrow, title, lead = '') => `
  <div class="section-title">
    <span class="eyebrow">${eyebrow}</span>
    <h2>${title}</h2>
    ${lead ? `<p class="lead">${lead}</p>` : ''}
  </div>`;

function breadcrumb(items) {
  return `<nav class="breadcrumb" aria-label="パンくず">${items
    .map((item, index) => (index + 1 === items.length ? `<span>${item[1]}</span>` : `<a href="${item[0]}">${item[1]}</a><span>/</span>`))
    .join('')}</nav>`;
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function relativeUrl(fromPath, target) {
  if (!target.startsWith('/') || target.startsWith('//')) return target;
  const fromDir = fromPath === '/' ? '' : fromPath.replace(/^\/|\/$/g, '') + '/';
  const targetPath = target.replace(/^\//, '');
  let relative = posix.relative(fromDir, targetPath);
  if (!relative) relative = '.';
  if (!fromDir && relative !== '.' && !relative.startsWith('.')) relative = `./${relative}`;
  if (target.endsWith('/') && !relative.endsWith('/')) relative += '/';
  return relative;
}

function localizeUrls(html, fromPath) {
  return html
    .replace(/\b(href|src)="\.\/images\/([^"]*)"/g, (_, attr, target) => `${attr}="${relativeUrl(fromPath, `/images/${target}`)}"`)
    .replace(/\b(href|src)="\/(?!\/)([^"]*)"/g, (_, attr, target) => `${attr}="${relativeUrl(fromPath, `/${target}`)}"`);
}

function layout({ path, title, description, body, breadcrumbItems = [], structuredData = [] }) {
  const pageTitle = path === '/' ? 'きょうはじまる | 小さなお店のWeb相談室' : `${title} | きょうはじまる`;
  const canonical = absolute(path);
  const nav = site.nav.map(([href, label]) => `<a href="${href}">${label}</a>`).join('');
  const crumbs =
    breadcrumbItems.length > 0
      ? jsonLd({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbItems.map(([href, name], index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name,
            item: absolute(href),
          })),
        })
      : '';
  const baseLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: site.name,
      alternateName: site.latinName,
      url: site.url,
      description: site.description,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name,
      url: site.url,
      description: site.description,
      inLanguage: 'ja',
    },
  ];

  const html = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(pageTitle)}</title>
    <meta name="description" content="${esc(description)}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${esc(pageTitle)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:site_name" content="${site.name}">
    <meta property="og:image" content="${absolute(site.logoImage)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(pageTitle)}">
    <meta name="twitter:description" content="${esc(description)}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@300;400;500;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/src/styles/style.css">
    ${[...baseLd, ...structuredData].map(jsonLd).join('\n')}
    ${crumbs}
  </head>
  <body class="${path === '/' ? 'is-home' : ''}">
    <header class="site-header">
      <div class="container header-inner">
        <a class="logo" href="/" aria-label="きょうはじまる トップへ">
          <img class="logo__image" src="${site.logoImage}" alt="きょうはじまる" width="2000" height="2000">
        </a>
        <nav class="nav" data-menu aria-label="サイト内メニュー">${nav}</nav>
        <a class="button button--primary header-cta" href="/contact/">お問い合わせ</a>
        <button class="menu-button" type="button" data-menu-toggle aria-expanded="false">Menu</button>
      </div>
    </header>
    <main>
      ${body}
    </main>
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <a class="logo" href="/">
              <img class="logo__mark" src="${site.logoSmallImage}" alt="" width="1024" height="1024">
              <span class="logo__text">
                <span class="logo__name">きょうはじまる</span>
                <span class="logo__tagline">小さなお店のWeb相談室</span>
              </span>
            </a>
            <p>ホームページやInstagram、LINE、予約導線を見直し、小さなお店の今やるべきことを整理します。</p>
          </div>
          <ul class="footer-nav">${site.nav.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('')}<li><a href="/privacy/">プライバシーポリシー</a></li></ul>
        </div>
        <p class="copyright">&copy; 2026 kyo-hazimaru</p>
      </div>
    </footer>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`;

  return localizeUrls(html, path);
}

function pageHero(title, lead, items) {
  return `<section class="page-hero"><div class="container">${breadcrumb(items)}<h1>${title}</h1><p class="lead">${lead}</p></div></section>`;
}

function writePage(path, html) {
  const file = path === '/' ? 'index.html' : join(path.slice(1), 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  pages.push(path);
}

const serviceCards = services
  .map((service) => `<a class="card" href="${service.href}"><span class="tag">${service.shortTitle}</span><h3>${service.title}</h3><p>${service.lead}</p><p><strong>料金目安: ${service.price}</strong></p></a>`)
  .join('');
const faqHtml = faqs.map((faq) => `<article class="faq-item"><h3>${faq.q}</h3><p>${faq.a}</p></article>`).join('');
const columnCards = columns
  .slice(0, 6)
  .map((post) => `<a class="card" href="/column/${post.slug}/"><div class="card__meta"><time datetime="${post.date}">${post.date}</time><span class="tag">${columnCategories.find((cat) => cat.slug === post.category).title}</span></div><h3>${post.title}</h3><p>${post.description}</p></a>`)
  .join('');

writePage(
  '/',
  layout({
    path: '/',
    title: 'きょうはじまる',
    description: site.description,
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: '小さなお店のWeb相談室',
        provider: { '@type': 'Organization', name: site.name },
        areaServed: ['大阪', '日本全国', 'オンライン'],
        serviceType: ['小さなお店 Web診断レポート', 'ホームページ診断', 'Instagram改善', 'LINE・予約導線の見直し'],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.slice(0, 4).map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      },
    ],
    body: `
      <section id="hero" class="hero" style="background-image: url('${site.heroImage}');">
        <div class="hero-copy">
          <h1>小さなお店の<br>Web相談室</h1>
          <p>ホームページやInstagram、なんとなく動かしていませんか？<br>お店のWebまわりを見直して、今やるべきことをレポートにまとめます。</p>
          <div class="hero__actions">${button('/services/', 'Web診断レポートを見る')}${button('/contact/', '相談してみる', 'secondary')}</div>
        </div>
      </section>
      <section class="section"><div class="container">${sectionTitle('About', 'きょうはじまるとは', '個人サロンや小さなお店のためのWeb相談室です。')}<div class="grid grid--2"><div class="card"><h3>まずは現状を整理する</h3><p>ホームページ、Instagram、LINE、予約導線など、Webまわりをまとめて見直し、今のお店に必要な改善ポイントをレポートにしてお届けします。</p></div><div class="card"><h3>いきなり制作しない相談室</h3><p>制作や運用を始める前に、何から直せばよいかをやさしく整理します。必要な方のみ、オンライン相談や追加サポートも選べます。</p></div></div></div></section>
      <section class="section section--soft"><div class="container">${sectionTitle('Trouble', 'こんなお悩みありませんか？')}<div class="grid grid--3">${['何から直せばいいかわからない','SNSを頑張っているけど予約につながらない','ホームページを作ったまま放置している','LINEや予約導線を整えたい','Instagramの見え方に自信がない','制作会社に頼む前に整理だけ相談したい'].map((text) => `<div class="card"><h3>${text}</h3></div>`).join('')}</div></div></section>
      <section class="section"><div class="container">${sectionTitle('Service', 'Web診断レポート', '小さなお店・個人サロン・ひとり事業主向けに、まずはWebまわりの現状と改善ポイントを整理します。')}<div class="grid grid--2">${serviceCards}</div></div></section>
      <section class="section section--soft"><div class="container">${sectionTitle('Reason', '大切にしていること')}<div class="grid grid--3"><div class="card"><h3>お店の言葉で整理する</h3><p>専門用語を並べず、今のお店に必要な見直しポイントとしてお伝えします。</p></div><div class="card"><h3>優先順位がわかる</h3><p>全部を一度に変えるのではなく、先に直すところから順番に整理します。</p></div><div class="card"><h3>必要な分だけ相談できる</h3><p>基本はレポート納品。迷う部分だけオンライン相談で一緒に確認できます。</p></div></div></div></section>
      <section class="section"><div class="container">${sectionTitle('Price', 'サービス・料金', '料金は仮の目安です。内容により変動します。')}<div class="price-table">${priceRows.map((row) => `<div class="price-row"><strong>${row[0]}</strong><span>${row[1]}</span><p>${row[2]}</p></div>`).join('')}</div><div class="actions">${button('/services/', '詳しく見る', 'secondary')}</div></div></section>
      <section class="section section--soft"><div class="container">${sectionTitle('Flow', 'ご相談の流れ')}<div class="grid grid--2 flow-list">${[
        ['お問い合わせ', '気になることや現在のお悩みを送ってください。'],
        ['Webまわりの確認', 'ホームページ、Instagram、LINE、予約ページなどを確認します。'],
        ['診断レポート作成', '改善ポイントや優先順位をレポートにまとめます。'],
        ['レポート納品', 'PDFまたはテキスト形式でお渡しします。'],
      ].map(([title, text]) => `<div class="card flow-item"><h3>${title}</h3><p>${text}</p></div>`).join('')}</div></div></section>
      <section class="section"><div class="container">${sectionTitle('Works', 'できること・支援領域')}<div class="grid grid--2">${works.map((work) => `<a class="card" href="/works/"><span class="tag">${work.category}</span><h3>${work.title}</h3><p>${work.scope}</p></a>`).join('')}</div></div></section>
      <section class="section section--soft"><div class="container">${sectionTitle('FAQ', 'よくある質問')}<div class="faq-list">${faqs.slice(0, 4).map((faq) => `<article class="faq-item"><h3>${faq.q}</h3><p>${faq.a}</p></article>`).join('')}</div><div class="actions">${button('/faq/', 'FAQを見る', 'secondary')}</div></div></section>
      <section class="section"><div class="container">${sectionTitle('Column', 'コラム')}<div class="grid grid--3">${columnCards}</div></div></section>
      <section class="section"><div class="container"><div class="cta"><h2>今のままでいいのかな？と思ったら。</h2><p>ホームページやInstagramの状態を、まずは一緒に整理しましょう。</p><div class="actions">${button('/contact/', 'Web診断を相談する', 'secondary')}</div></div></div></section>`,
  }),
);

writePage('/services/', layout({
  path: '/services/',
  title: 'サービス・料金',
  description: '小さなお店のWeb診断レポート、オンライン相談オプション、必要に応じたWebまわりのサポートの料金目安です。',
  breadcrumbItems: [['/', 'ホーム'], ['/services/', 'サービス・料金']],
  structuredData: services.map((service) => ({ '@context': 'https://schema.org', '@type': 'Service', name: service.title, description: service.lead, provider: { '@type': 'Organization', name: site.name }, offers: { '@type': 'Offer', priceCurrency: 'JPY', price: service.price.replace(/\D/g, '') || undefined } })),
  body: `${pageHero('サービス・料金', 'ベースはWeb診断レポートです。必要な方のみ、オンライン相談や追加サポートを選べます。', [['/', 'ホーム'], ['/services/', 'サービス・料金']])}
  <section class="section"><div class="container">${sectionTitle('Service', '小さなお店のWeb診断レポート', 'ホームページやInstagram、LINE、予約導線を確認し、今やるべきことを整理します。')}<div class="grid grid--2">${serviceCards}</div></div></section>
  <section class="section section--soft"><div class="container">${sectionTitle('Price', '料金目安', '料金は仮の目安です。内容により変動します。')}<div class="price-table">${priceRows.map((row) => `<div class="price-row"><strong>${row[0]}</strong><span>${row[1]}</span><p>${row[2]}</p></div>`).join('')}</div></div></section>
  <section class="section"><div class="container">${sectionTitle('Fit', 'どの内容が合うか')}<div class="grid grid--3"><div class="card"><h3>まず確認したい方</h3><p>ライト診断レポートで、気になる部分を小さく見直します。</p></div><div class="card"><h3>全体を整えたい方</h3><p>しっかり診断レポートで、Webまわりをまとめて確認します。</p></div><div class="card"><h3>一緒に整理したい方</h3><p>オンライン相談オプションで、レポートを見ながら進め方を確認します。</p></div></div></div></section>
  <section class="section section--soft"><div class="container">${sectionTitle('FAQ', 'サービスのFAQ')}<div class="faq-list">${faqHtml}</div></div></section>
  <section class="section"><div class="container"><div class="cta"><h2>今のWebまわりを、まずは整理します。</h2><p>ホームページやInstagram、今のままでいいのかな？と思ったらお気軽にご相談ください。</p><div class="actions">${button('/contact/', 'Web診断を相談する', 'secondary')}</div></div></div></section>`,
}));

for (const service of services) {
  writePage(service.href, layout({
    path: service.href,
    title: service.title,
    description: service.lead,
    breadcrumbItems: [['/', 'ホーム'], ['/services/', 'サービス・料金'], [service.href, service.title]],
    structuredData: [{ '@context': 'https://schema.org', '@type': 'Service', name: service.title, description: service.lead, provider: { '@type': 'Organization', name: site.name } }],
    body: `${pageHero(service.title, service.lead, [['/', 'ホーム'], ['/services/', 'サービス・料金'], [service.href, service.title]])}
    <section class="section"><div class="container"><div class="grid grid--2"><div class="card"><h2>向いている人</h2><p>${service.forWhom}</p></div><div class="card"><h2>料金目安</h2><p>${service.price}<br>内容により変動します。</p></div></div></div></section>
    <section class="section section--soft"><div class="container">${sectionTitle('Support', '確認すること')}<ul class="grid grid--2">${service.includes.map((item) => `<li class="card"><h3>${item}</h3><p>小さなお店の今の状況に合わせて、分かりやすく整理します。</p></li>`).join('')}</ul></div></section>
    <section class="section"><div class="container"><div class="cta"><h2>${service.shortTitle}について相談する</h2><p>必要な範囲を一緒に整理します。</p><div class="actions">${button('/contact/', '問い合わせる', 'secondary')}</div></div></div></section>`,
  }));
}

writePage('/flow/', layout({
  path: '/flow/',
  title: 'ご相談の流れ',
  description: '小さなお店のWeb診断レポートのお問い合わせから、Webまわりの確認、レポート納品、オンライン相談までの流れです。',
  breadcrumbItems: [['/', 'ホーム'], ['/flow/', 'ご相談の流れ']],
  body: `${pageHero('ご相談の流れ', 'お問い合わせからレポート納品まで、無理のない順番で進めます。', [['/', 'ホーム'], ['/flow/', 'ご相談の流れ']])}
  <section class="section"><div class="container"><div class="grid grid--2 flow-list">${[
    ['お問い合わせ', '気になることや現在のお悩みを送ってください。'],
    ['Webまわりの確認', 'ホームページ、Instagram、LINE、予約ページなどを確認します。'],
    ['診断レポート作成', '改善ポイントや優先順位をレポートにまとめます。'],
    ['レポート納品', 'PDFまたはテキスト形式でお渡しします。'],
    ['必要な方のみオンライン相談', 'レポートを見ながら、今後の進め方を一緒に整理します。'],
  ].map(([title, text]) => `<div class="card flow-item"><h3>${title}</h3><p>${text}</p></div>`).join('')}</div></div></section>`,
}));

writePage('/faq/', layout({
  path: '/faq/',
  title: 'よくある質問',
  description: '小さなお店のWeb診断レポート、オンライン相談、ホームページやInstagramの見直しについてのよくある質問です。',
  breadcrumbItems: [['/', 'ホーム'], ['/faq/', 'よくある質問']],
  structuredData: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })) }],
  body: `${pageHero('よくある質問', '相談前の不安を減らせるよう、よくいただく質問をまとめました。', [['/', 'ホーム'], ['/faq/', 'よくある質問']])}<section class="section"><div class="container"><div class="faq-list">${faqHtml}</div></div></section>`,
}));

writePage('/about/', layout({
  path: '/about/',
  title: '運営者について',
  description: 'きょうはじまるを作った理由、Web診断レポートで大切にしていること、支援できる領域について紹介します。',
  breadcrumbItems: [['/', 'ホーム'], ['/about/', '運営者について']],
  body: `${pageHero('運営者について', '個人サロンや小さなお店が、Webまわりをやさしく見直せる相談室です。', [['/', 'ホーム'], ['/about/', '運営者について']])}
  <section class="section"><div class="container"><div class="grid grid--2"><div class="card"><h2>作った理由</h2><p>「何から直せばいいかわからない」という状態のまま、いきなり制作や運用を始めなくて済むように、まず現状を整理する場所を作りました。</p></div><div class="card"><h2>大切にしていること</h2><p>ホームページ、Instagram、LINE、予約導線を、お店の規模や今の負担に合わせて見直します。無理に大きな施策へ進めず、必要な一歩を一緒に考えます。</p></div></div></div></section>
  <section class="section section--soft"><div class="container">${sectionTitle('Profile', '支援できる領域')}<div class="grid grid--3">${['Webサイト制作経験','SNS運用経験','小規模事業者向けWeb導線の整理'].map((title) => `<div class="card"><h3>${title}</h3><p>診断レポートの中で、今のお店に必要な見直しポイントとして整理します。</p></div>`).join('')}</div></div></section>
  <section class="section"><div class="container"><div class="cta"><h2>小さなお店のWebまわりを、一緒に整理します。</h2><div class="actions">${button('/contact/', 'Web診断を相談する', 'secondary')}</div></div></div></section>`,
}));

writePage('/works/', layout({
  path: '/works/',
  title: '支援領域',
  description: 'Webサイト制作経験、SNS運用経験、小規模事業者向けWeb導線の整理など、きょうはじまるがサポートできる領域です。',
  breadcrumbItems: [['/', 'ホーム'], ['/works/', '支援領域']],
  body: `${pageHero('支援領域', '診断レポートで確認できること、必要に応じてサポートできる領域をまとめています。', [['/', 'ホーム'], ['/works/', '支援領域']])}
  <section class="section"><div class="container"><div class="grid grid--2">${works.map((work) => `<article class="card"><span class="tag">${work.category}</span><h2>${work.title}</h2><p><strong>業種:</strong> ${work.industry}</p><p><strong>相談前の悩み:</strong> ${work.before}</p><p><strong>行ったこと:</strong> ${work.action}</p><p><strong>結果:</strong> ${work.result}</p><p><strong>担当範囲:</strong> ${work.scope}</p><p><strong>お客様の声:</strong> ${work.voice}</p></article>`).join('')}</div></div></section>`,
}));

writePage('/column/', layout({
  path: '/column/',
  title: 'コラム一覧',
  description: '個人サロンや小さなお店向けに、Web集客、ホームページ見直し、SNS・LINE導線のコラムを掲載します。',
  breadcrumbItems: [['/', 'ホーム'], ['/column/', 'コラム']],
  body: `${pageHero('コラム一覧', '相談前に読める、Webまわりの小さなヒントです。', [['/', 'ホーム'], ['/column/', 'コラム']])}
  <section class="section"><div class="container">${sectionTitle('Category', 'カテゴリ')}<div class="grid grid--2">${columnCategories.map((cat) => `<a class="card" href="/column/${cat.slug}/"><h2>${cat.title}</h2><p>${cat.description}</p></a>`).join('')}</div></div></section>
  <section class="section section--soft"><div class="container">${sectionTitle('Articles', '記事一覧')}<div class="grid grid--3">${columns.map((post) => `<a class="card" href="/column/${post.slug}/"><div class="card__meta"><time datetime="${post.date}">${post.date}</time><span class="tag">${columnCategories.find((cat) => cat.slug === post.category).title}</span></div><h3>${post.title}</h3><p>${post.description}</p></a>`).join('')}</div></div></section>`,
}));

for (const cat of columnCategories) {
  writePage(`/column/${cat.slug}/`, layout({
    path: `/column/${cat.slug}/`,
    title: `${cat.title}カテゴリ`,
    description: cat.description,
    breadcrumbItems: [['/', 'ホーム'], ['/column/', 'コラム'], [`/column/${cat.slug}/`, cat.title]],
    body: `${pageHero(cat.title, cat.description, [['/', 'ホーム'], ['/column/', 'コラム'], [`/column/${cat.slug}/`, cat.title]])}<section class="section"><div class="container"><div class="grid grid--3">${columns.filter((post) => post.category === cat.slug).map((post) => `<a class="card" href="/column/${post.slug}/"><h3>${post.title}</h3><p>${post.description}</p></a>`).join('')}</div></div></section>`,
  }));
}

for (const post of columns) {
  const cat = columnCategories.find((item) => item.slug === post.category);
  writePage(`/column/${post.slug}/`, layout({
    path: `/column/${post.slug}/`,
    title: post.title,
    description: post.description,
    breadcrumbItems: [['/', 'ホーム'], ['/column/', 'コラム'], [`/column/${cat.slug}/`, cat.title], [`/column/${post.slug}/`, post.title]],
    structuredData: [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.description, datePublished: post.date, author: { '@type': 'Organization', name: site.name }, publisher: { '@type': 'Organization', name: site.name }, mainEntityOfPage: absolute(`/column/${post.slug}/`) }],
    body: `${pageHero(post.title, post.description, [['/', 'ホーム'], ['/column/', 'コラム'], [`/column/${cat.slug}/`, cat.title], [`/column/${post.slug}/`, post.title]])}<article class="section"><div class="container article-body"><span class="tag">${cat.title}</span>${['結論', 'よくある悩み', '原因', '解決方法', '具体例', 'きょうはじまるで相談できること', 'FAQ', 'CTA'].map((heading, index) => `<section><h2>${heading}</h2><p>${post.body[index % post.body.length]}</p></section>`).join('')}<div class="cta"><h2>この記事の内容を自分のお店に置き換えて相談できます。</h2><div class="actions">${button('/contact/', '相談する', 'secondary')}</div></div></div></article>`,
  }));
}

writePage('/contact/', layout({
  path: '/contact/',
  title: 'お問い合わせ',
  description: '小さなお店のWeb診断レポート、オンライン相談オプションについてのお問い合わせページです。',
  breadcrumbItems: [['/', 'ホーム'], ['/contact/', 'お問い合わせ']],
  body: `${pageHero('お問い合わせ', 'ホームページやInstagram、今のままでいいのかな？と思ったら、まずはお気軽にご相談ください。', [['/', 'ホーム'], ['/contact/', 'お問い合わせ']])}<section class="section"><div class="container"><div class="card"><h2>小さなお店のWebまわりを一緒に整理します。</h2><p>フォームは準備中です。公開時はメールフォームまたはLINE相談導線を設置できます。</p><div class="actions">${button('mailto:hello@example.com', 'まずは問い合わせる')}</div></div></div></section>`,
}));

writePage('/privacy/', layout({
  path: '/privacy/',
  title: 'プライバシーポリシー',
  description: 'きょうはじまるのプライバシーポリシーです。',
  breadcrumbItems: [['/', 'ホーム'], ['/privacy/', 'プライバシーポリシー']],
  body: `${pageHero('プライバシーポリシー', 'お問い合わせで取得する情報の取り扱いについて記載します。', [['/', 'ホーム'], ['/privacy/', 'プライバシーポリシー']])}<section class="section"><div class="container article-body"><h2>個人情報の利用目的</h2><p>取得した情報は、お問い合わせへの回答、サービス案内、必要な連絡のために利用します。</p><h2>第三者提供</h2><p>法令に基づく場合を除き、本人の同意なく第三者へ提供しません。</p><h2>お問い合わせ</h2><p>個人情報の取り扱いに関するお問い合わせは、サイトのお問い合わせ窓口よりご連絡ください。</p></div></section>`,
}));

const robots = `User-agent: *\nAllow: /\nSitemap: ${absolute('/sitemap.xml')}\n`;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((page) => `  <url><loc>${absolute(page)}</loc></url>`).join('\n')}\n</urlset>\n`;

writeFileSync('robots.txt', robots);
writeFileSync('sitemap.xml', sitemap);
writeFileSync('public/robots.txt', robots);
writeFileSync('public/sitemap.xml', sitemap);

rmSync('dist', { recursive: true, force: true });
