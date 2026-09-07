/* XR Wiki — comments, and the line naming who looks after each page.

   The wiki is a docsify site on GitHub Pages, which serves static files and
   runs nothing, so both of these are read-only in the browser and lean on
   GitHub for the rest: the comments are GitHub Discussions rendered by giscus,
   and the maintainers are whoever `.github/CODEOWNERS` names for the page's
   path.

   Nothing here signs anybody in, holds a credential, or writes to the
   repository. The wiki is edited on github.com. */

var WIKI = {
  owner: 'XRWiki',
  repo: 'XRWiki.github.io',
  branch: 'main',
  /* Where the markdown lives inside the repository. Docsify routes are
     relative to this, so `#/meta/RootGuide` is `docs/meta/RootGuide.md`. */
  root: 'docs/',

  /* giscus keeps the comments in this repository's GitHub Discussions. Both ids
     are public and safe to ship — they identify the repository and the category
     to file threads under, and neither grants anything.

     Announcements is the category because its format only lets maintainers and
     giscus open a discussion. That is the property that matters: a thread is
     created the first time somebody comments on a page, and nobody can
     hand-make threads that shadow a page that has none. To move the comments to
     a category of their own, make one with the Announcement format and put its
     name and id here — worth doing before threads accumulate, since existing
     ones would have to be re-filed by hand. */
  giscus: {
    repoId: 'R_kgDORNHS7A',
    category: 'Announcements',
    categoryId: 'DIC_kwDORNHS7M4DFGYw'
  }
};

/* An earlier version of this file let people edit pages from the site, which
   meant asking them to paste a GitHub access token and keeping it in
   localStorage. That feature is gone, so the token is now a credential sitting
   in a browser with nothing to use it — swept out here on the next visit.
   Anyone who created one should also revoke it at
   https://github.com/settings/tokens, since deleting this copy does not. */
(function () {
  try {
    localStorage.removeItem('xrwiki.gh.token');
    localStorage.removeItem('xrwiki.gh.user');
  } catch (e) {}
})();

/* ---------- small helpers ---------- */

function el(tag, attrs, kids) {
  var node = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) {
    if (k === 'class') node.className = attrs[k];
    else if (k === 'text') node.textContent = attrs[k];
    else if (k === 'html') node.innerHTML = attrs[k];
    else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
  });
  (kids || []).forEach(function (kid) { if (kid) node.appendChild(kid); });
  return node;
}

/* ---------- where are we ---------- */

/* The docsify route for the page on screen, without the leading slash, the
   query string or the `.md` — `meta/roottweaks/led/RainbowLed`. The homepage
   routes to an empty string and is served from `gettingstarted.md`. */
function route() {
  var hash = location.hash.replace(/^#\/?/, '').split('?')[0].split('#')[0];
  return decodeURIComponent(hash).replace(/\.md$/, '');
}

/* The file in the repository backing the page on screen. */
function currentPath() {
  var r = route();
  if (!r || r === '/') return WIKI.root + 'gettingstarted.md';
  return WIKI.root + r + '.md';
}

function historyUrl(path) {
  return 'https://github.com/' + WIKI.owner + '/' + WIKI.repo +
    '/commits/' + WIKI.branch + '/' + path;
}

/* ---------- maintainers ---------- */

/* CODEOWNERS is GitHub's own answer to "who owns this page": the rules are
   path patterns, GitHub enforces them on every pull request, and the last
   matching rule wins. Parsed here only to name the people on the page — the
   enforcement is GitHub's, not this file's.

   Read from raw.githubusercontent rather than the API, and once per visit, so
   that reading the wiki costs no API quota at all. */
var ownersCache = null;

function loadOwners() {
  if (ownersCache) return ownersCache;
  ownersCache = fetch('https://raw.githubusercontent.com/' + WIKI.owner + '/' +
      WIKI.repo + '/' + WIKI.branch + '/.github/CODEOWNERS')
    .then(function (res) { return res.ok ? res.text() : ''; })
    .then(function (text) {
      /* Split on both endings: the repository is written on Windows and most
         of its files are CRLF, which left on the end of a line is enough to
         stop the last handle on it being recognised. */
      return text.split(/\r?\n/).reduce(function (rules, line) {
        var trimmed = line.replace(/#.*$/, '').trim();
        if (!trimmed) return rules;
        var parts = trimmed.split(/\s+/);
        var owners = parts.slice(1).filter(function (o) { return o[0] === '@'; });
        if (owners.length) rules.push({ pattern: parts[0], owners: owners });
        return rules;
      }, []);
    })
    .catch(function () { return []; });
  return ownersCache;
}

/* CODEOWNERS globbing, to the extent this wiki uses it: a leading `/` anchors
   to the repository root, a trailing `/` covers everything beneath a directory,
   `**` spans path segments and `*` matches within one.

   Built a character at a time rather than by chaining `replace` calls, because
   the chained version has to park `**` somewhere `*` will not find it, and the
   usual trick — a placeholder control character — is invisible in the source
   and silently breaks the moment the file is copied through something that
   strips it. */
function ownerMatch(pattern, path) {
  var p = pattern;
  if (p.slice(-1) === '/') p += '**';
  if (p[0] !== '/' && p.indexOf('/') === -1) p = '**/' + p;
  p = p.replace(/^\//, '');

  var rx = '';
  for (var i = 0; i < p.length; i++) {
    var c = p.charAt(i);
    if (c === '*') {
      if (p.charAt(i + 1) === '*') {
        if (p.charAt(i + 2) === '/') { rx += '(?:.*/)?'; i += 2; }
        else { rx += '.*'; i += 1; }
      } else {
        rx += '[^/]*';
      }
    } else if ('.+^${}()|[]?/'.indexOf(c) > -1) {
      rx += (c === '/' ? '/' : '\\' + c);
    } else {
      rx += c;
    }
  }
  return new RegExp('^' + rx + '$').test(path);
}

function ownersFor(path) {
  return loadOwners().then(function (rules) {
    var found = [];
    rules.forEach(function (rule) {
      if (ownerMatch(rule.pattern, path)) found = rule.owners;
    });
    return found;
  });
}

/* ---------- the page toolbar ---------- */

/* One line above the page: who looks after it, and a way to see what has
   changed. Both point at GitHub — the wiki itself is read-only. */
function renderToolbar() {
  var section = document.querySelector('.markdown-section');
  if (!section) return;

  var existing = section.querySelector(':scope > .wiki-bar');
  if (existing) existing.remove();

  var path = currentPath();
  var maintainers = el('span', { class: 'wiki-maintainers' });

  var bar = el('div', { class: 'wiki-bar' }, [
    el('div', { class: 'wiki-bar-meta' }, [
      el('span', { class: 'wiki-eyebrow', text: 'Maintainers' }),
      maintainers
    ]),
    el('div', { class: 'wiki-bar-actions' }, [
      el('a', { class: 'wiki-btn wiki-btn-quiet', href: historyUrl(path),
        target: '_blank', rel: 'noopener', text: 'History' })
    ])
  ]);

  section.insertBefore(bar, section.firstChild);

  ownersFor(path).then(function (owners) {
    maintainers.textContent = '';
    if (!owners.length) {
      maintainers.appendChild(el('span', { class: 'wiki-muted', text: 'unassigned' }));
      return;
    }
    owners.forEach(function (owner) {
      var name = owner.replace(/^@/, '');
      maintainers.appendChild(el('a', {
        href: name.indexOf('/') > -1
          ? 'https://github.com/orgs/' + name.split('/')[0] + '/teams/' + name.split('/')[1]
          : 'https://github.com/' + name,
        target: '_blank', rel: 'noopener', text: owner
      }));
    });
  });
}

/* ---------- comments ---------- */

/* giscus keeps each page's thread in this repository's GitHub Discussions, so
   the comments are as portable as the pages, and moderating one is the same
   Discussions moderation the owners already have.

   The mapping has to be `specific`. Docsify puts the route in the fragment, so
   every page shares one pathname and giscus's usual `pathname` mapping would
   file the whole wiki under a single thread. The route is passed as the term
   instead, and the frame is rebuilt whenever the route changes. */
var commentRoute = null;

function renderComments() {
  var section = document.querySelector('.markdown-section');
  if (!section) return;

  var term = route() || 'gettingstarted';
  var mount = section.querySelector(':scope > .wiki-comments');

  if (mount && commentRoute === term) { section.appendChild(mount); return; }
  if (mount) mount.remove();
  commentRoute = term;

  mount = el('section', { class: 'wiki-comments' }, [
    el('h2', { class: 'wiki-comments-head', text: 'Comments' })
  ]);
  section.appendChild(mount);

  if (!WIKI.giscus.categoryId) {
    mount.appendChild(el('p', { class: 'wiki-note', html:
      'Comments are not switched on yet. An owner needs to enable ' +
      '<strong>Discussions</strong> in the repository settings, install the ' +
      '<a href="https://github.com/apps/giscus" target="_blank" rel="noopener">giscus app</a>, ' +
      'then fill in <code>WIKI.giscus.categoryId</code> in <code>wiki.js</code>.' }));
    return;
  }

  var frame = el('div', { class: 'wiki-giscus' });
  mount.appendChild(frame);

  var script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.setAttribute('data-repo', WIKI.owner + '/' + WIKI.repo);
  script.setAttribute('data-repo-id', WIKI.giscus.repoId);
  script.setAttribute('data-category', WIKI.giscus.category);
  script.setAttribute('data-category-id', WIKI.giscus.categoryId);
  script.setAttribute('data-mapping', 'specific');
  script.setAttribute('data-term', term);
  script.setAttribute('data-strict', '1');
  script.setAttribute('data-reactions-enabled', '1');
  script.setAttribute('data-emit-metadata', '0');
  script.setAttribute('data-input-position', 'top');
  script.setAttribute('data-theme', giscusTheme());
  script.setAttribute('data-lang', 'en');
  script.setAttribute('data-loading', 'lazy');
  frame.appendChild(script);
}

/* giscus renders in its own frame with its own stylesheet, so it cannot read
   the wiki's tokens. The nine palettes map onto its two, by ground. */
var LIGHT_THEMES = ['light', 'paper'];

function giscusTheme() {
  var theme = document.documentElement.dataset.theme || '';
  return LIGHT_THEMES.indexOf(theme) > -1 ? 'light' : 'transparent_dark';
}

function retintComments() {
  var frame = document.querySelector('iframe.giscus-frame');
  if (!frame) return;
  frame.contentWindow.postMessage(
    { giscus: { setConfig: { theme: giscusTheme() } } }, 'https://giscus.app');
}

new MutationObserver(retintComments).observe(document.documentElement, {
  attributes: true, attributeFilter: ['data-theme']
});

/* ---------- wiring ---------- */

window.$docsify.plugins = (window.$docsify.plugins || []).concat([
  function (hook) {
    hook.doneEach(function () {
      renderToolbar();
      renderComments();
    });
  }
]);
