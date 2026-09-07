/* XR Wiki — the collaborative layer: comments, in-page editing, page and
   folder creation, and the maintainer list.

   The wiki is a docsify site on GitHub Pages, which serves static files and
   runs nothing. So git is the database and GitHub is the account system: a
   page is a markdown file, an edit is a commit or a pull request, and the
   moderators and owners of a page are the people CODEOWNERS names for its
   path. Nothing here needs a server, and nothing here stores wiki content
   anywhere but this repository.

   Two ways in, because the people who edit constantly and the people who fix
   one typo want opposite things:

     - Connected. A token in this browser's localStorage buys the editor that
       saves without leaving the page. Someone with push access commits to
       `main`; everyone else gets a fork and a pull request opened for them.
     - Not connected. Every control still works, by handing off to github.com,
       which does the forking and the pull request itself. No setup at all.

   The token never leaves the browser it was pasted into. */

var WIKI = {
  owner: 'XRWiki',
  repo: 'XRWiki.github.io',
  branch: 'main',
  /* Where the markdown lives inside the repository. Docsify routes are
     relative to this, so `#/meta/RootGuide` is `docs/meta/RootGuide.md`. */
  root: 'docs/',
  api: 'https://api.github.com',

  /* giscus keeps the comments in this repository's GitHub Discussions. The
     repo id is public and safe to ship; `categoryId` is filled in once
     Discussions is switched on and the giscus app is installed. Until then
     the comment section says so rather than rendering a broken frame. */
  giscus: {
    repoId: 'R_kgDORNHS7A',
    category: 'Page comments',
    categoryId: ''
  }
};

var TOKEN_KEY = 'xrwiki.gh.token';

/* ---------- small helpers ---------- */

function el(tag, attrs, kids) {
  var node = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) {
    if (k === 'class') node.className = attrs[k];
    else if (k === 'text') node.textContent = attrs[k];
    else if (k === 'html') node.innerHTML = attrs[k];
    else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
  });
  (kids || []).forEach(function (kid) { if (kid) node.appendChild(kid); });
  return node;
}

function token() {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
}

function setToken(value) {
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
}

/* base64 that survives the pound signs, arrows and box-drawing characters the
   guides are full of. `btoa` only takes latin-1, so the string goes through
   UTF-8 first. */
function encodeContent(text) {
  var bytes = new TextEncoder().encode(text);
  var binary = '';
  bytes.forEach(function (b) { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function decodeContent(base64) {
  var binary = atob(base64.replace(/\s/g, ''));
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/* This repository is written on Windows and its files are CRLF. Two things go
   wrong if that is ignored. Splitting on "\n" alone leaves a "\r" on the end of
   every line, which is enough to stop the sidebar parser matching anything at
   all. And a textarea hands its value back with the newlines normalised to
   "\n" whatever went in, so saving a CRLF guide unchanged would rewrite all
   three hundred of its lines — turning the pull request a moderator has to
   read into a whole-file diff. Both are avoided by carrying the file's own
   ending through the edit. */
function detectEol(text) {
  return /\r\n/.test(text) ? '\r\n' : '\n';
}

function withEol(text, eol) {
  var lf = text.replace(/\r\n/g, '\n');
  return eol === '\r\n' ? lf.replace(/\n/g, '\r\n') : lf;
}

function api(path, options) {
  options = options || {};
  var headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (token()) headers.Authorization = 'Bearer ' + token();
  if (options.body) headers['Content-Type'] = 'application/json';

  return fetch(path.slice(0, 4) === 'http' ? path : WIKI.api + path, {
    method: options.method || 'GET',
    headers: headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  }).then(function (res) {
    if (res.status === 204) return null;
    return res.json().catch(function () { return null; }).then(function (data) {
      if (res.ok) return data;
      var err = new Error((data && data.message) || ('GitHub returned ' + res.status));
      err.status = res.status;
      throw err;
    });
  });
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

function pageTitle() {
  var h1 = document.querySelector('.markdown-section h1');
  return h1 ? h1.textContent.trim() : route() || 'Getting Started';
}

/* ---------- session ---------- */

/* Who the token belongs to and what it can do here. `GET /repos/:o/:r` returns
   a `permissions` block for whoever is asking, which is the one check a person
   with no push access is still allowed to make — the collaborators endpoint
   403s for exactly the people whose access we most need to know about. */
var session = { state: 'anonymous', user: null, canPush: false, role: 'Reader' };
var sessionWaiters = [];

function onSession(fn) {
  sessionWaiters.push(fn);
  if (session.state !== 'loading') fn(session);
}

function announceSession() {
  sessionWaiters.forEach(function (fn) { fn(session); });
}

function loadSession() {
  if (!token()) {
    session = { state: 'anonymous', user: null, canPush: false, role: 'Reader' };
    announceSession();
    return Promise.resolve(session);
  }
  session.state = 'loading';
  return Promise.all([api('/user'), api('/repos/' + WIKI.owner + '/' + WIKI.repo)])
    .then(function (res) {
      var perms = res[1].permissions || {};
      session = {
        state: 'signed-in',
        user: res[0],
        canPush: !!perms.push,
        role: perms.admin ? 'Owner'
          : perms.maintain ? 'Moderator'
          : perms.push ? 'Editor'
          : 'Contributor'
      };
      announceSession();
      return session;
    })
    .catch(function () {
      /* A revoked or mistyped token is worse than none: it makes every later
         call fail in a way that looks like the wiki is broken. Drop it. */
      setToken('');
      session = { state: 'anonymous', user: null, canPush: false, role: 'Reader' };
      announceSession();
      return session;
    });
}

/* ---------- maintainers ---------- */

/* CODEOWNERS is GitHub's own answer to "who owns this page": the rules are
   path patterns, GitHub enforces them on every pull request, and the last
   matching rule wins. Parsed here only to name the people on the page — the
   enforcement is GitHub's, not this file's. */
var ownersCache = null;

function loadOwners() {
  if (ownersCache) return ownersCache;
  ownersCache = fetch('https://raw.githubusercontent.com/' + WIKI.owner + '/' +
      WIKI.repo + '/' + WIKI.branch + '/.github/CODEOWNERS')
    .then(function (res) { return res.ok ? res.text() : ''; })
    .then(function (text) {
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
   to the repository root, a trailing `/` or `/*` covers a directory, and `*`
   matches within one path segment. */
function ownerMatch(pattern, path) {
  var p = pattern;
  if (p.slice(-1) === '/') p += '**';
  if (p[0] !== '/' && p.indexOf('/') === -1) p = '**/' + p;
  var rx = p.replace(/^\//, '')
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '\u0000')
    .replace(/\*\*/g, '\u0001')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '(?:.*/)?')
    .replace(/\u0001/g, '.*');
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

/* ---------- reading and writing the repository ---------- */

/* Reading goes through the contents API rather than raw.githubusercontent so
   the blob sha comes back with the text. The sha is what makes the save safe:
   GitHub rejects the write if the file moved underneath the editor, which is
   the whole conflict story on a wiki several people edit. */
function readFile(path) {
  return api('/repos/' + WIKI.owner + '/' + WIKI.repo + '/contents/' +
      encodeURI(path) + '?ref=' + WIKI.branch)
    .then(function (data) {
      return { text: decodeContent(data.content), sha: data.sha };
    })
    .catch(function (err) {
      if (err.status === 404) return { text: '', sha: null };
      throw err;
    });
}

function ghUrl(kind, path) {
  var base = 'https://github.com/' + WIKI.owner + '/' + WIKI.repo;
  if (kind === 'edit') return base + '/edit/' + WIKI.branch + '/' + path;
  if (kind === 'new') return base + '/new/' + WIKI.branch + '?filename=' + encodeURIComponent(path);
  if (kind === 'history') return base + '/commits/' + WIKI.branch + '/' + path;
  if (kind === 'blame') return base + '/blame/' + WIKI.branch + '/' + path;
  return base;
}

function putFile(repoFullName, branch, file, message) {
  var body = {
    message: message,
    content: encodeContent(file.text),
    branch: branch
  };
  if (file.sha) body.sha = file.sha;
  return api('/repos/' + repoFullName + '/contents/' + encodeURI(file.path), {
    method: 'PUT',
    body: body
  });
}

/* A fork is created asynchronously — the POST returns before the repository is
   actually there, and writing to it too early 404s. Poll until it answers. */
function ensureFork() {
  var login = session.user.login;
  return api('/repos/' + WIKI.owner + '/' + WIKI.repo + '/forks', { method: 'POST' })
    .then(function (fork) {
      var full = fork.full_name || (login + '/' + WIKI.repo);
      var tries = 0;
      return (function wait() {
        return api('/repos/' + full).catch(function () {
          if (++tries > 12) throw new Error('Your fork is taking longer than usual to appear. Try again in a moment.');
          return new Promise(function (r) { setTimeout(r, 1500); }).then(wait);
        });
      })().then(function () { return full; });
    });
}

/* One entry point for every change the site makes, so the two audiences never
   need separate call sites: `files` is a list of {path, text, sha}, and where
   it lands depends only on whether this account can push here.

   Someone with push access commits straight to the branch. Everyone else gets
   a fork, a working branch, and a pull request opened against this repository
   — the same route a contributor would take by hand, minus the steps. The
   branch is cut from *this* repository's head rather than the fork's, so a
   fork left behind months ago does not silently revert anyone's work. */
function submitChanges(files, opts) {
  var slug = WIKI.owner + '/' + WIKI.repo;

  if (session.canPush) {
    return files.reduce(function (chain, file) {
      return chain.then(function () { return putFile(slug, WIKI.branch, file, opts.message); });
    }, Promise.resolve()).then(function () {
      return { kind: 'commit', url: ghUrl('history', files[0].path) };
    });
  }

  var branch = 'wiki-edit/' + Date.now().toString(36);
  var fork;

  return ensureFork()
    .then(function (full) {
      fork = full;
      return api('/repos/' + slug + '/git/ref/heads/' + WIKI.branch);
    })
    .then(function (ref) {
      return api('/repos/' + fork + '/git/refs', {
        method: 'POST',
        body: { ref: 'refs/heads/' + branch, sha: ref.object.sha }
      });
    })
    .then(function () {
      return files.reduce(function (chain, file) {
        return chain.then(function () { return putFile(fork, branch, file, opts.message); });
      }, Promise.resolve());
    })
    .then(function () {
      return api('/repos/' + slug + '/pulls', {
        method: 'POST',
        body: {
          title: opts.prTitle || opts.message,
          head: session.user.login + ':' + branch,
          base: WIKI.branch,
          body: opts.prBody || ''
        }
      });
    })
    .then(function (pr) {
      return { kind: 'pull-request', url: pr.html_url, number: pr.number };
    });
}

/* ---------- the sidebar file ---------- */

/* `_sidebar.md` is hand-curated — the order is editorial and the `>` prefix
   marks a folder — so new pages are inserted into it rather than the whole
   thing being regenerated from the directory tree. A generated sidebar would
   alphabetise the Monterey guides and put "Downgrading" before "Unlocking",
   which is the wrong order to do them in.

   Each entry is read back as its indent depth, its label and its target, which
   is enough to offer real insertion points and to write a new line at the
   depth its parent implies. */
function parseSidebar(text) {
  return text.split(/\r?\n/).map(function (line, i) {
    var m = line.match(/^(\s*)\*\s+(.*)$/);
    if (!m) return { line: i, raw: line, kind: 'other' };
    var indent = m[1].replace(/\t/g, '  ').length;
    var body = m[2];
    var link = body.match(/^\[([^\]]*)\]\(([^)]*)\)$/);
    var section = body.match(/^\*\*(.+)\*\*$/);
    if (section) {
      return { line: i, raw: line, kind: 'section', depth: indent / 2, label: section[1], indent: m[1] };
    }
    if (link) {
      var label = link[1];
      var folder = label.slice(0, 1) === '>';
      return {
        line: i,
        raw: line,
        kind: folder ? 'folder' : 'page',
        depth: indent / 2,
        label: label.replace(/^>\s*/, ''),
        target: link[2],
        indent: m[1]
      };
    }
    return { line: i, raw: line, kind: 'other' };
  });
}

/* Insert `entry` as the last child of the container at `parentLine`, or at the
   end of the file when there is no parent. "Last child" means just past the
   final consecutive line that is deeper than the parent, so the new page lands
   at the bottom of its folder instead of the top of the next one. */
function insertSidebarEntry(text, parentLine, label, target, isFolder) {
  var eol = detectEol(text);
  var lines = text.split(/\r?\n/);
  var entries = parseSidebar(text);
  var parent = entries.find(function (e) { return e.line === parentLine; });
  var depth = parent ? parent.depth + 1 : 1;
  var body = '[' + (isFolder ? '> ' : '') + label + '](' + (target || '') + ')';
  var line = new Array(depth * 2 + 1).join(' ') + '* ' + body;

  if (!parent) {
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    lines.push(line, '');
    return lines.join(eol);
  }

  var at = parentLine + 1;
  for (var i = parentLine + 1; i < entries.length; i++) {
    var e = entries[i];
    if (e.kind === 'other') {
      if (!e.raw.trim()) continue;
      break;
    }
    if (e.depth <= parent.depth) break;
    at = e.line + 1;
  }
  lines.splice(at, 0, line);
  return lines.join(eol);
}

/* ---------- dialogs ---------- */

var openLayers = [];

function closeTop() {
  var layer = openLayers.pop();
  if (!layer) return;
  layer.node.remove();
  if (!openLayers.length) document.body.classList.remove('wiki-modal-open');
  if (layer.restore && layer.restore.focus) layer.restore.focus();
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && openLayers.length) {
    e.stopPropagation();
    closeTop();
  }
});

/* One shell for everything modal: a scrim, a panel, a titled header and a
   footer of actions. `wide` is the editor, which wants the room. */
function openLayer(opts) {
  var restore = document.activeElement;

  var status = el('p', { class: 'wiki-status', role: 'status' });
  var footer = el('div', { class: 'wiki-dialog-foot' }, [status]);
  var buttons = {};

  (opts.actions || []).forEach(function (action) {
    var btn = el('button', {
      type: 'button',
      class: 'wiki-btn' + (action.primary ? ' wiki-btn-primary' : ''),
      text: action.label,
      onclick: function () { action.onClick(handle); }
    });
    buttons[action.name || action.label] = btn;
    footer.appendChild(btn);
  });

  var titleId = 'wiki-dialog-title-' + Math.random().toString(36).slice(2);
  var panel = el('div', {
    class: 'wiki-dialog' + (opts.wide ? ' wiki-dialog-wide' : ''),
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': titleId
  }, [
    el('div', { class: 'wiki-dialog-head' }, [
      el('div', {}, [
        el('h2', { id: titleId, text: opts.title }),
        opts.subtitle ? el('p', { class: 'wiki-dialog-sub', text: opts.subtitle }) : null
      ]),
      el('button', {
        type: 'button', class: 'wiki-close', 'aria-label': 'Close', text: '×',
        onclick: function () { closeTop(); }
      })
    ]),
    el('div', { class: 'wiki-dialog-body' }, [opts.body]),
    footer
  ]);

  var node = el('div', {
    class: 'wiki-scrim',
    onclick: function (e) { if (e.target === node && !opts.sticky) closeTop(); }
  }, [panel]);

  var handle = {
    node: node,
    panel: panel,
    buttons: buttons,
    restore: restore,
    close: function () {
      var i = openLayers.indexOf(handle);
      if (i > -1) { openLayers.splice(i, 1); node.remove(); }
      if (!openLayers.length) document.body.classList.remove('wiki-modal-open');
      if (restore && restore.focus) restore.focus();
    },
    say: function (message, tone) {
      status.textContent = message || '';
      status.className = 'wiki-status' + (tone ? ' wiki-status-' + tone : '');
    },
    busy: function (on) {
      Object.keys(buttons).forEach(function (k) { buttons[k].disabled = !!on; });
      panel.classList.toggle('is-busy', !!on);
    }
  };

  document.body.appendChild(node);
  document.body.classList.add('wiki-modal-open');
  openLayers.push(handle);

  var first = panel.querySelector('input, textarea, select, button.wiki-btn-primary');
  if (first) first.focus();
  return handle;
}

function field(label, input, hint) {
  var id = 'wiki-f-' + Math.random().toString(36).slice(2);
  input.id = id;
  return el('div', { class: 'wiki-field' }, [
    el('label', { for: id, text: label }),
    input,
    hint ? el('p', { class: 'wiki-hint', html: hint }) : null
  ]);
}

/* ---------- connecting an account ---------- */

/* There is no server here to hold an OAuth client secret, so the sign-in is a
   token the reader creates themselves and pastes in once. It stays in this
   browser's localStorage and is sent to api.github.com and nowhere else.

   `public_repo` is the smallest scope that covers what the site does: fork,
   branch, commit and open a pull request against a public repository. */
var TOKEN_URL = 'https://github.com/settings/tokens/new' +
  '?scopes=public_repo&description=XR%20Wiki%20editing';

function connectDialog(after, handoff) {
  var input = el('input', {
    type: 'password',
    class: 'wiki-input',
    placeholder: 'ghp_…',
    autocomplete: 'off',
    spellcheck: 'false'
  });

  var body = el('div', {}, [
    el('ol', { class: 'wiki-steps' }, [
      el('li', { html: 'Open <a href="' + TOKEN_URL + '" target="_blank" rel="noopener">' +
        'the token page on GitHub</a> — the name and permission are filled in already.' }),
      el('li', { text: 'Pick an expiry, scroll down and press Generate token.' }),
      el('li', { text: 'Copy the token it shows you once, and paste it below.' })
    ]),
    field('Personal access token', input,
      'Kept in this browser only, and sent to api.github.com and nowhere else. ' +
      'Signing out deletes it. You can revoke it on GitHub at any time.'),
    el('p', { class: 'wiki-note', text: handoff
      ? 'You do not need this to contribute. ' + handoff.note +
        ' Connecting just means you never have to leave the wiki.'
      : 'The token is only ever used for edits you make yourself.' })
  ]);

  var dialog = openLayer({
    title: 'Connect your GitHub account',
    subtitle: 'So you can edit, create and comment without leaving the wiki',
    body: body,
    actions: [handoff ? {
      /* The way through for someone who will edit one page once and does not
         want an access token for the privilege. github.com does the forking
         and opens the pull request itself. */
      name: 'handoff',
      label: handoff.label,
      onClick: function (h) {
        window.open(handoff.url, '_blank', 'noopener');
        h.close();
      }
    } : null, {
      name: 'connect',
      label: 'Connect',
      primary: true,
      onClick: function (h) {
        var value = input.value.trim();
        if (!value) return h.say('Paste the token first.', 'bad');
        h.busy(true);
        h.say('Checking…');
        setToken(value);
        loadSession().then(function (s) {
          h.busy(false);
          if (s.state !== 'signed-in') {
            return h.say('GitHub would not accept that token. Check it was copied whole and has not expired.', 'bad');
          }
          h.close();
          renderToolbar();
          if (after) after(s);
        });
      }
    }].filter(Boolean)
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') dialog.buttons.connect.click();
  });
  return dialog;
}

/* ---------- the editor ---------- */

/* The callouts the guides lean on are not markdown — they are blockquotes that
   docsify-plugin-flexible-alerts rewrites after the fact, and the plugin only
   runs over the real page. Left alone, the preview shows a bare `[!NOTE]` on
   pages that are half callouts, which makes it useless for judging the one
   thing it exists to judge. This reproduces the markup the plugin emits, so
   the preview picks up the same styles from style.css. */
var ALERT_KINDS = {
  NOTE: 'note', TIP: 'tip', IMPORTANT: 'note',
  WARNING: 'warning', CAUTION: 'caution', ATTENTION: 'attention'
};

function applyAlerts(root) {
  Array.prototype.forEach.call(root.querySelectorAll('blockquote'), function (quote) {
    var first = quote.querySelector('p');
    if (!first) return;
    var m = first.innerHTML.match(/^\s*\[!(\w+)\]\s*(?:<br\s*\/?>)?\s*/i);
    if (!m) return;
    var kind = ALERT_KINDS[m[1].toUpperCase()];
    if (!kind) return;

    first.innerHTML = first.innerHTML.slice(m[0].length);
    var label = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
    var box = el('div', { class: 'alert callout ' + kind }, [
      el('p', { class: 'title' }, [
        el('span', { class: 'icon icon-' + kind }),
        document.createTextNode(label)
      ])
    ]);
    while (quote.firstChild) box.appendChild(quote.firstChild);
    quote.parentNode.replaceChild(box, quote);
  });
}

function renderMarkdown(text) {
  try {
    if (window.marked) {
      return typeof window.marked === 'function'
        ? window.marked(text)
        : window.marked.parse(text);
    }
  } catch (e) {}
  return '<pre>' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</pre>';
}

/* The editor is markdown on the left and the page as it will look on the
   right, in the wiki's own stylesheet rather than a generic preview pane —
   the whole point of editing here instead of in GitHub's textarea. */
function openEditor(opts) {
  var textarea = el('textarea', {
    class: 'wiki-editor-input',
    spellcheck: 'false',
    'aria-label': 'Page markdown'
  });
  textarea.value = opts.text || '';

  var preview = el('div', { class: 'wiki-editor-preview markdown-section' });
  var previewTimer;
  function paint() {
    preview.innerHTML = renderMarkdown(textarea.value);
    applyAlerts(preview);
    if (window.Prism) window.Prism.highlightAllUnder(preview);
  }
  textarea.addEventListener('input', function () {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(paint, 180);
  });

  var summary = el('input', {
    type: 'text',
    class: 'wiki-input',
    placeholder: opts.defaultSummary,
    'aria-label': 'Summary of the change'
  });

  var body = el('div', { class: 'wiki-editor' }, [
    el('div', { class: 'wiki-editor-panes' }, [
      el('div', { class: 'wiki-editor-pane' }, [
        el('p', { class: 'wiki-eyebrow', text: 'Markdown' }), textarea
      ]),
      el('div', { class: 'wiki-editor-pane' }, [
        el('p', { class: 'wiki-eyebrow', text: 'Preview' }), preview
      ])
    ]),
    field('Summary of the change', summary,
      session.canPush
        ? 'Becomes the commit message on <code>' + WIKI.branch + '</code>.'
        : 'Becomes the title of the pull request opened for you.')
  ]);

  var dialog = openLayer({
    wide: true,
    sticky: true,
    title: opts.title,
    subtitle: opts.path,
    body: body,
    actions: [
      { name: 'cancel', label: 'Cancel', onClick: function (h) { h.close(); } },
      {
        name: 'save',
        primary: true,
        label: session.canPush ? 'Save to the wiki' : 'Propose this change',
        onClick: function (h) {
          var message = summary.value.trim() || opts.defaultSummary;
          h.busy(true);
          h.say(session.canPush ? 'Committing…' : 'Opening a pull request for you…');
          opts.save(withEol(textarea.value, opts.eol || '\n'), message)
            .then(function (result) {
            h.busy(false);
            h.close();
            reportResult(result, opts.reload);
          }).catch(function (err) {
            h.busy(false);
            h.say(err.message || 'That did not go through.', 'bad');
          });
        }
      }
    ]
  });

  paint();
  textarea.focus();
  /* Focusing a filled textarea leaves the caret at the end, which on a guide
     this long opens the editor looking at the last line of the file. */
  textarea.setSelectionRange(0, 0);
  textarea.scrollTop = 0;
  return dialog;
}

/* What happened, and where to look at it. A commit reloads the page underneath
   so the author sees their own edit; a pull request cannot, so it links out. */
function reportResult(result, reload) {
  var isPr = result.kind === 'pull-request';
  openLayer({
    title: isPr ? 'Pull request #' + result.number + ' opened' : 'Saved',
    body: el('div', {}, [
      el('p', { text: isPr
        ? 'Your change is waiting for a maintainer of this page to review it. ' +
          'You will get a GitHub notification when they respond.'
        : 'The change is committed. GitHub Pages usually publishes it within a minute.' }),
      el('p', {}, [
        el('a', { class: 'wiki-btn wiki-btn-primary', href: result.url,
          target: '_blank', rel: 'noopener',
          text: isPr ? 'View the pull request' : 'View the commit history' })
      ])
    ]),
    actions: [{
      name: 'done', label: 'Done', onClick: function (h) {
        h.close();
        if (!isPr && reload) setTimeout(function () { location.reload(); }, 400);
      }
    }]
  });
}

function requireAccount(then, handoff) {
  if (session.state === 'signed-in') return then();
  connectDialog(function () { then(); }, handoff);
}

/* ---------- edit an existing page ---------- */

function editCurrentPage() {
  var path = currentPath();
  requireAccount(function () {
    readFile(path).then(function (file) {
      openEditor({
        title: 'Editing ' + pageTitle(),
        path: path,
        text: file.text,
        eol: detectEol(file.text),
        defaultSummary: 'Update ' + pageTitle(),
        reload: true,
        save: function (text, message) {
          return submitChanges([{ path: path, text: text, sha: file.sha }], {
            message: message,
            prTitle: message,
            prBody: 'Edited from the wiki at ' + location.href
          });
        }
      });
    }).catch(function (err) {
      alertLayer('Could not open that page', err.message);
    });
  }, {
    label: 'Edit on github.com',
    url: ghUrl('edit', path),
    note: 'Edit on github.com opens this same file in GitHub\u2019s editor, ' +
      'which forks the wiki and opens the pull request for you.'
  });
}

function alertLayer(title, message) {
  openLayer({
    title: title,
    body: el('p', { text: message }),
    actions: [{ name: 'ok', label: 'Close', primary: true, onClick: function (h) { h.close(); } }]
  });
}

/* ---------- new pages and folders ---------- */

function slug(text) {
  return text.trim()
    .replace(/['"]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'untitled';
}

/* Which directory a sidebar container's pages live in — asked of its existing
   children first, and only then of the container itself.

   That order matters. `> Specific Tweaks` points at `montereyGuides/tweaks.md`
   but its pages are in `montereyGuides/tweaks/`: a folder's overview page
   often sits beside the directory rather than inside it, so the folder's own
   target is the worse guess wherever there is a child to ask instead. A
   container with no children yet — a folder made a minute ago — falls back to
   its own, and a section with neither falls back to the docs root. */
function containerDir(entries, container) {
  var candidates = container ? entries.filter(function (e) {
    return e.line > container.line && e.depth > container.depth && e.target;
  }) : [];
  if (container && container.target) candidates.push(container);
  for (var i = 0; i < candidates.length; i++) {
    var t = candidates[i].target;
    if (!t) continue;
    var dir = t.replace(/[^/]*$/, '');
    if (dir) return dir;
  }
  return '';
}

function containerOptions(entries) {
  return entries.filter(function (e) {
    return e.kind === 'section' || e.kind === 'folder';
  });
}

function newThingDialog(kind) {
  var isFolder = kind === 'folder';
  var sidebarPath = WIKI.root + '_sidebar.md';
  var state = { text: '', sha: null, entries: [] };

  var title = el('input', { type: 'text', class: 'wiki-input', placeholder:
    isFolder ? 'Quest 3 Guides' : 'Disabling Guardian' });
  var where = el('select', { class: 'wiki-select' });
  var path = el('input', { type: 'text', class: 'wiki-input', spellcheck: 'false' });
  var pathTouched = false;
  path.addEventListener('input', function () { pathTouched = true; });

  function suggestPath() {
    if (pathTouched) return;
    var container = state.entries.find(function (e) { return String(e.line) === where.value; });
    var dir = containerDir(state.entries, container);
    var name = slug(title.value || (isFolder ? 'new-folder' : 'new-page'));
    path.value = isFolder
      ? WIKI.root + dir + name + '/' + name + '.md'
      : WIKI.root + dir + name + '.md';
  }
  title.addEventListener('input', suggestPath);
  where.addEventListener('change', suggestPath);

  var body = el('div', {}, [
    field(isFolder ? 'Folder name' : 'Page title', title),
    field('Where it goes', where, 'The section or folder of the sidebar it is filed under.'),
    field(isFolder ? 'Overview page file' : 'File', path,
      isFolder
        ? 'A folder needs something in it, so it starts with one overview page. ' +
          'Add more pages to it afterwards with New page.'
        : 'Its path in the repository. The wiki URL follows from it.')
  ]);

  var dialog = openLayer({
    title: isFolder ? 'New folder' : 'New page',
    subtitle: 'Added to the sidebar and to the repository in one change',
    body: body,
    actions: [
      { name: 'cancel', label: 'Cancel', onClick: function (h) { h.close(); } },
      {
        name: 'next',
        primary: true,
        label: 'Write it',
        onClick: function (h) {
          var label = title.value.trim();
          if (!label) return h.say('Give it a name first.', 'bad');
          var file = path.value.trim();
          if (!/\.md$/.test(file)) return h.say('The file has to end in .md', 'bad');
          if (file.indexOf(WIKI.root) !== 0) return h.say('The file has to sit inside ' + WIKI.root, 'bad');

          var container = state.entries.find(function (e) { return String(e.line) === where.value; });
          var route = file.slice(WIKI.root.length).replace(/\.md$/, '');
          h.close();

          openEditor({
            title: isFolder ? 'Overview page for ' + label : 'New page: ' + label,
            path: file,
            text: '# ' + label + '\n\n',
            /* A new page takes the sidebar's line ending, so the repository
               stays uniform rather than gaining its first LF file. */
            eol: detectEol(state.text),
            defaultSummary: (isFolder ? 'Add folder ' : 'Add page ') + label,
            reload: false,
            save: function (text, message) {
              /* The folder case is two sidebar lines, not one: the folder
                 button, then the overview page beneath it. The folder is
                 written first so its line number is known before the page is
                 nested under it. */
              var sidebar = state.text;
              if (isFolder) {
                sidebar = insertSidebarEntry(sidebar, container ? container.line : null, label, '', true);
                var added = parseSidebar(sidebar).find(function (e) {
                  return e.kind === 'folder' && e.label === label && !e.target;
                });
                sidebar = insertSidebarEntry(sidebar, added ? added.line : null, 'Overview', route + '.md', false);
              } else {
                sidebar = insertSidebarEntry(sidebar, container ? container.line : null, label, route + '.md', false);
              }
              return submitChanges([
                { path: file, text: text, sha: null },
                { path: sidebarPath, text: sidebar, sha: state.sha }
              ], {
                message: message,
                prTitle: message,
                prBody: 'Created from the wiki at ' + location.href
              }).then(function (result) {
                if (result.kind === 'commit') {
                  result.url = 'https://github.com/' + WIKI.owner + '/' + WIKI.repo +
                    '/blob/' + WIKI.branch + '/' + file;
                }
                return result;
              });
            }
          });
        }
      }
    ]
  });

  dialog.busy(true);
  dialog.say('Reading the sidebar…');
  readFile(sidebarPath).then(function (file) {
    state.text = file.text;
    state.sha = file.sha;
    state.entries = parseSidebar(file.text);
    containerOptions(state.entries).forEach(function (e) {
      where.appendChild(el('option', {
        value: String(e.line),
        text: new Array(e.depth + 1).join('   ') + e.label
      }));
    });
    where.appendChild(el('option', { value: '', text: 'Bottom of the sidebar' }));
    dialog.busy(false);
    dialog.say('');
    suggestPath();
    title.focus();
  }).catch(function (err) {
    dialog.busy(false);
    dialog.say(err.message || 'Could not read the sidebar.', 'bad');
  });

  return dialog;
}

function newThing() {
  requireAccount(function () {
    openLayer({
      title: 'Add to the wiki',
      body: el('div', { class: 'wiki-choices' }, [
        el('button', { type: 'button', class: 'wiki-choice', onclick: function () {
          closeTop(); newThingDialog('page');
        } }, [
          el('strong', { text: 'A page' }),
          el('span', { text: 'One guide or reference, filed in an existing section or folder.' })
        ]),
        el('button', { type: 'button', class: 'wiki-choice', onclick: function () {
          closeTop(); newThingDialog('folder');
        } }, [
          el('strong', { text: 'A folder' }),
          el('span', { text: 'A collapsible group in the sidebar, starting with one overview page.' })
        ])
      ]),
      actions: [{ name: 'cancel', label: 'Cancel', onClick: function (h) { h.close(); } }]
    });
  }, {
    label: 'Add on github.com',
    url: ghUrl('new', WIKI.root),
    note: 'Add on github.com opens GitHub\u2019s new-file page, which forks the ' +
      'wiki and opens the pull request for you \u2014 though you will have to ' +
      'add the sidebar line yourself, which the editor here does for you.'
  });
}

/* ---------- the page toolbar ---------- */

function renderToolbar() {
  var section = document.querySelector('.markdown-section');
  if (!section) return;

  var existing = section.querySelector(':scope > .wiki-bar');
  if (existing) existing.remove();

  var path = currentPath();
  var maintainers = el('span', { class: 'wiki-maintainers', text: 'checking…' });

  var actions = el('div', { class: 'wiki-bar-actions' }, [
    el('button', { type: 'button', class: 'wiki-btn', text: 'Edit this page', onclick: editCurrentPage }),
    el('button', { type: 'button', class: 'wiki-btn', text: 'New', onclick: newThing }),
    el('a', { class: 'wiki-btn wiki-btn-quiet', href: ghUrl('history', path),
      target: '_blank', rel: 'noopener', text: 'History' })
  ]);

  var bar = el('div', { class: 'wiki-bar' }, [
    el('div', { class: 'wiki-bar-meta' }, [
      el('span', { class: 'wiki-eyebrow', text: 'Maintainers' }),
      maintainers
    ]),
    actions
  ]);

  section.insertBefore(bar, section.firstChild);

  ownersFor(path).then(function (owners) {
    maintainers.textContent = '';
    if (!owners.length) {
      maintainers.appendChild(el('span', { class: 'wiki-muted',
        text: 'anyone can propose a change' }));
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

/* The account sits in the sidebar next to the theme picker: it is the other
   thing that is true of the whole wiki rather than of one page, and the
   sidebar is the only furniture docsify keeps across a route change. */
function renderAccount() {
  var sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  var foot = sidebar.querySelector('.sidebar-foot');
  var row = sidebar.querySelector('.sidebar-account');
  if (!row) {
    row = el('div', { class: 'sidebar-account' });
    if (foot) sidebar.insertBefore(row, foot);
    else sidebar.appendChild(row);
  }
  row.textContent = '';

  if (session.state === 'signed-in') {
    row.appendChild(el('img', {
      class: 'sidebar-avatar', src: session.user.avatar_url + '&s=48', alt: ''
    }));
    row.appendChild(el('div', { class: 'sidebar-account-who' }, [
      el('a', { class: 'sidebar-account-name', href: session.user.html_url,
        target: '_blank', rel: 'noopener', text: session.user.login }),
      el('span', { class: 'sidebar-account-role', text: session.role })
    ]));
    row.appendChild(el('button', {
      type: 'button', class: 'sidebar-signout', text: 'Sign out',
      title: 'Forget the token stored in this browser',
      onclick: function () {
        setToken('');
        loadSession().then(function () { renderAccount(); renderToolbar(); });
      }
    }));
  } else {
    row.appendChild(el('button', {
      type: 'button', class: 'wiki-btn wiki-btn-block', text: 'Connect GitHub',
      onclick: function () { connectDialog(); }
    }));
  }
}

onSession(renderAccount);

/* ---------- comments ---------- */

/* giscus keeps each page's thread in this repository's GitHub Discussions, so
   the comments are as portable as the pages and moderating one is the same
   Discussions moderation GitHub already gives the owners.

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

loadSession();

window.$docsify.plugins = (window.$docsify.plugins || []).concat([
  function (hook) {
    hook.doneEach(function () {
      renderToolbar();
      renderComments();
      renderAccount();
    });
    hook.mounted(function () {
      renderAccount();
    });
  }
]);
