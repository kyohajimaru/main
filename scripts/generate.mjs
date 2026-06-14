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

const absolute = (path) => new URL(path, site.url).toString();
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
  if (target.endsWith('/') && !relative.endsWith('/')) relative += '/';
  return relative;
}

function localizeUrls(html, fromPath) {
  return html.replace(/\b(href|src)="\/(?!\/)([^"]*)"/g, (_, attr, target) => `${attr}="${relativeUrl(fromPath, `/${target}`)}"`);
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
  <body>
    <header class="site-header">
      <div class="container header-inner">
        <a class="logo" href="/" aria-label="きょうはじまる トップへ">
          <img class="logo__mark" src="${site.logoSmallImage}" alt="" width="1024" height="1024">
          <span class="logo__text">
            <span class="logo__name">きょうはじまる</span>
            <span class="logo__tagline">小さなお店のWeb相談室</span>
          </span>
        </a>
        <nav class="nav" data-menu aria-label="サイト内メニュー">${nav}</nav>
        <a class="button button--primary header-cta" href="/contact/">まずは相談する</a>
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
            <p>ホームページ制作、SNS運用、LINE導線づくり、AI活用まで。小さなお店の今日の一歩を整えます。</p>
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
        serviceType: ['小さなお店 Web相談', '個人サロン ホームページ制作', 'SNS運用', 'LINE導線づくり', 'AI活用サポート'],
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
      <section class="hero">
        <div class="hero__image"><img src="${site.heroImage}" alt="朝の光が差し込む木漏れ日と青空"></div>
        <div class="container hero__body">
          <span class="hero__badge">kyo-hazimaru / web consultation</span>
          <h1>小さなお店の「やりたい」を、<br>今日から形に。</h1>
          <p>ホームページ制作、SNS運用、LINE導線づくり、AI活用まで。個人サロンや小規模事業者さまのWebまわりを、わかりやすく整理します。</p>
          <div class="hero__actions">${button('/contact/', 'まずは相談する')}${button('/services/', 'サービスを見る', 'secondary')}</div>
        </div>
      </section>
      <section class="section"><div class="container">${sectionTitle('About', 'きょうはじまるとは', '個人サロンや小さなお店の「何から始めたらいい？」に寄り添うWeb相談室です。')}<div class="grid grid--2"><div class="card"><h3>今日の一歩に分けて考える</h3><p>大きな制作の前に、今あるSNS、ホームページ、LINE、予約導線を見ながら、最初に整えることを決めます。</p></div><div class="card"><h3>あしたはれそらから続く安心感</h3><p>税理士・社労士事務所「あしたはれそら」のWeb制作・運用経験をもとに、小さなお店向けに分かりやすく展開します。</p></div></div></div></section>
      <section class="section section--soft"><div class="container">${sectionTitle('Trouble', 'こんなお悩みありませんか？')}<div class="grid grid--3">${['ホームページとSNS、どちらから始めるべきか分からない','Instagramから予約やLINE登録につながらない','AIを使いたいけれど業務にどう入れるか分からない','個人サロンらしい信頼感のあるサイトを持ちたい','検索に出るための基本設定が不安','制作会社に頼む前に整理だけ相談したい'].map((text) => `<div class="card"><h3>${text}</h3></div>`).join('')}</div></div></section>
      <section class="section"><div class="container">${sectionTitle('Service', 'できること', '小さなお店・個人サロン・個人事業主向けに、相談から制作、運用整理まで対応します。')}<div class="grid grid--2">${serviceCards}</div></div></section>
      <section class="section section--soft"><div class="container">${sectionTitle('Reason', '選ばれる理由')}<div class="grid grid--3"><div class="card"><h3>専門用語をほどく</h3><p>SEO、SNS、LINE、AIをお店の言葉に置き換えて説明します。</p></div><div class="card"><h3>小さく始められる</h3><p>全部を作る前に、今必要な範囲だけを見極めます。</p></div><div class="card"><h3>系列ブランドの安心感</h3><p>あしたはれそらの誠実な相談姿勢を引き継ぎ、芽吹きや朝の光の世界観で届けます。</p></div></div></div></section>
      <section class="section"><div class="container">${sectionTitle('Price', 'サービス・料金', '料金は仮の目安です。内容により変動します。')}<div class="price-table">${priceRows.map((row) => `<div class="price-row"><strong>${row[0]}</strong><span>${row[1]}</span><p>${row[2]}</p></div>`).join('')}</div><div class="actions">${button('/services/', '詳しく見る', 'secondary')}</div></div></section>
      <section class="section section--soft"><div class="container">${sectionTitle('Flow', 'ご相談の流れ')}<div class="grid grid--2 flow-list">${['ヒアリング','現状整理とご提案','お見積り・ご契約','制作・運用サポート'].map((title) => `<div class="card flow-item"><h3>${title}</h3><p>現在の状況を確認し、必要な順番で進めます。</p></div>`).join('')}</div></div></section>
      <section class="section"><div class="container">${sectionTitle('Works', '支援事例')}<div class="grid grid--2">${works.map((work) => `<a class="card" href="/works/"><span class="tag">${work.category}</span><h3>${work.title}</h3><p>${work.before}</p></a>`).join('')}</div></div></section>
      <section class="section section--soft"><div class="container">${sectionTitle('FAQ', 'よくある質問')}<div class="faq-list">${faqs.slice(0, 4).map((faq) => `<article class="faq-item"><h3>${faq.q}</h3><p>${faq.a}</p></article>`).join('')}</div><div class="actions">${button('/faq/', 'FAQを見る', 'secondary')}</div></div></section>
      <section class="section"><div class="container">${sectionTitle('Column', 'コラム')}<div class="grid grid--3">${columnCards}</div></div></section>
      <section class="section"><div class="container"><div class="cta"><h2>まだふわっとした段階でも大丈夫です。</h2><p>「ホームページ SNS 何から始める？」という段階から、一緒に整理します。</p><div class="actions">${button('/contact/', 'まずは相談する', 'secondary')}</div></div></div></section>`,
  }),
);

writePage('/services/', layout({
  path: '/services/',
  title: 'サービス・料金',
  description: '小さなお店のWeb相談、ホームページ制作、SNS・LINE導線、AI活用サポートのサービスと料金目安です。',
  breadcrumbItems: [['/', 'ホーム'], ['/services/', 'サービス・料金']],
  structuredData: services.map((service) => ({ '@context': 'https://schema.org', '@type': 'Service', name: service.title, description: service.lead, provider: { '@type': 'Organization', name: site.name }, offers: { '@type': 'Offer', priceCurrency: 'JPY', price: service.price.replace(/\D/g, '') || undefined } })),
  body: `${pageHero('サービス・料金', '相談だけでも、制作まででも。小さなお店に必要なWebまわりを、今の状況に合わせて整えます。', [['/', 'ホーム'], ['/services/', 'サービス・料金']])}
  <section class="section"><div class="container">${sectionTitle('Service', 'サービス一覧')}<div class="grid grid--2">${serviceCards}</div></div></section>
  <section class="section section--soft"><div class="container">${sectionTitle('Price', '料金目安', '料金は仮の目安です。内容により変動します。')}<div class="price-table">${priceRows.map((row) => `<div class="price-row"><strong>${row[0]}</strong><span>${row[1]}</span><p>${row[2]}</p></div>`).join('')}</div></div></section>
  <section class="section"><div class="container">${sectionTitle('Fit', 'どのプランが合うか')}<div class="grid grid--3"><div class="card"><h3>迷っている方</h3><p>まずはWeb相談プランで整理します。</p></div><div class="card"><h3>信頼の土台がほしい方</h3><p>ホームページ制作サポートが向いています。</p></div><div class="card"><h3>発信を予約につなげたい方</h3><p>SNS・LINE導線サポートで流れを整えます。</p></div></div></div></section>
  <section class="section section--soft"><div class="container">${sectionTitle('FAQ', 'サービスのFAQ')}<div class="faq-list">${faqHtml}</div></div></section>
  <section class="section"><div class="container"><div class="cta"><h2>必要なプランを一緒に選びます。</h2><p>まだ決まっていない状態でご相談ください。</p><div class="actions">${button('/contact/', '相談する', 'secondary')}</div></div></div></section>`,
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
    <section class="section section--soft"><div class="container">${sectionTitle('Support', '相談・制作で行うこと')}<ul class="grid grid--2">${service.includes.map((item) => `<li class="card"><h3>${item}</h3><p>小さなお店の運用に合わせて、無理なく進めます。</p></li>`).join('')}</ul></div></section>
    <section class="section"><div class="container"><div class="cta"><h2>${service.shortTitle}について相談する</h2><p>必要な範囲を一緒に整理します。</p><div class="actions">${button('/contact/', '問い合わせる', 'secondary')}</div></div></div></section>`,
  }));
}

writePage('/flow/', layout({
  path: '/flow/',
  title: 'ご相談の流れ',
  description: 'きょうはじまるへの初回相談から、Webまわりの整理、制作・運用サポートまでの流れです。',
  breadcrumbItems: [['/', 'ホーム'], ['/flow/', 'ご相談の流れ']],
  body: `${pageHero('ご相談の流れ', 'はじめてのご相談からサポート開始まで、無理のない順番で進めます。', [['/', 'ホーム'], ['/flow/', 'ご相談の流れ']])}
  <section class="section"><div class="container"><div class="grid grid--2 flow-list">${['ヒアリング','現状整理とご提案','お見積り・ご契約','制作・運用サポート','継続フォロー'].map((title) => `<div class="card flow-item"><h3>${title}</h3><p>今の状況に合わせて、次に必要なことを確認します。</p></div>`).join('')}</div></div></section>`,
}));

writePage('/faq/', layout({
  path: '/faq/',
  title: 'よくある質問',
  description: '小さなお店のWeb相談、ホームページ制作、SNS・LINE導線、AI活用についてのよくある質問です。',
  breadcrumbItems: [['/', 'ホーム'], ['/faq/', 'よくある質問']],
  structuredData: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })) }],
  body: `${pageHero('よくある質問', '相談前の不安を減らせるよう、よくいただく質問をまとめました。', [['/', 'ホーム'], ['/faq/', 'よくある質問']])}<section class="section"><div class="container"><div class="faq-list">${faqHtml}</div></div></section>`,
}));

writePage('/about/', layout({
  path: '/about/',
  title: '運営者について',
  description: 'きょうはじまるを作った理由、あしたはれそらとのつながり、Web制作・運用経験について紹介します。',
  breadcrumbItems: [['/', 'ホーム'], ['/about/', '運営者について']],
  body: `${pageHero('運営者について', '税理士・社労士事務所「あしたはれそら」のWeb制作・運用経験をもとに、小さなお店のWeb相談室として展開しています。', [['/', 'ホーム'], ['/about/', '運営者について']])}
  <section class="section"><div class="container"><div class="grid grid--2"><div class="card"><h2>作った理由</h2><p>小さなお店や個人事業主の方が、ホームページ、SNS、LINE、AIで迷ったときに、制作前から相談できる場所を作りたいと考えました。</p></div><div class="card"><h2>あしたはれそらとのつながり</h2><p>あしたはれそらの安心感や誠実さを受け継ぎながら、きょうはじまるでは「芽吹き・朝・今日の一歩」をテーマにWebまわりを支えます。</p></div></div></div></section>
  <section class="section section--soft"><div class="container">${sectionTitle('Profile', '運営者プロフィール')}<div class="grid grid--3">${['Web制作・運用','SNS・LINE導線整理','AI活用サポート'].map((title) => `<div class="card"><h3>${title}</h3><p>小さなお店の現場に合わせて、分かりやすく整理します。</p></div>`).join('')}</div></div></section>
  <section class="section"><div class="container"><div class="cta"><h2>あなたのお店の今日の一歩を、一緒に整理します。</h2><div class="actions">${button('/contact/', '相談する', 'secondary')}</div></div></div></section>`,
}));

writePage('/works/', layout({
  path: '/works/',
  title: '支援事例',
  description: 'きょうはじまるのモニター事例、制作実績、相談事例、改善事例を掲載します。',
  breadcrumbItems: [['/', 'ホーム'], ['/works/', '支援事例']],
  body: `${pageHero('支援事例', '実績が少ない初期段階でも、相談内容と行ったことが伝わる形式で掲載します。', [['/', 'ホーム'], ['/works/', '支援事例']])}
  <section class="section"><div class="container"><div class="grid grid--2">${works.map((work) => `<article class="card"><span class="tag">${work.category}</span><h2>${work.title}</h2><p><strong>業種:</strong> ${work.industry}</p><p><strong>相談前の悩み:</strong> ${work.before}</p><p><strong>行ったこと:</strong> ${work.action}</p><p><strong>結果:</strong> ${work.result}</p><p><strong>担当範囲:</strong> ${work.scope}</p><p><strong>お客様の声:</strong> ${work.voice}</p></article>`).join('')}</div></div></section>`,
}));

writePage('/column/', layout({
  path: '/column/',
  title: 'コラム一覧',
  description: '個人サロンや小さなお店向けに、Web集客、ホームページ制作、SNS・LINE導線、AI活用のコラムを掲載します。',
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
  description: '小さなお店のWeb相談、ホームページ制作、SNS・LINE導線、AI活用についてのお問い合わせページです。',
  breadcrumbItems: [['/', 'ホーム'], ['/contact/', 'お問い合わせ']],
  body: `${pageHero('お問い合わせ', 'まだふわっとした段階でも大丈夫です。何から整えるか一緒に考えます。', [['/', 'ホーム'], ['/contact/', 'お問い合わせ']])}<section class="section"><div class="container"><div class="card"><h2>お問い合わせ方法</h2><p>フォームは準備中です。公開時はメールフォームまたはLINE相談導線を設置できます。</p><div class="actions">${button('mailto:hello@example.com', 'メールで相談する')}</div></div></div></section>`,
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
