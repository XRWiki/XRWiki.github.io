function initFolders() {
  var nav = document.querySelector('.sidebar-nav');
  if (!nav) return;
  nav.querySelectorAll('a').forEach(function(a) {
    if (!a.textContent.trim().startsWith('>')) return;
    var li = a.parentElement;
    if (!li || li.tagName !== 'LI' || li.dataset.folder) return;
    li.dataset.folder = '1';
    var childUl = li.querySelector('ul');
    var btn = document.createElement('a');
    btn.className = 'sidebar-folder-button';
    btn.textContent = a.textContent.trim().replace(/^>\s*/, '');
    if (childUl) {
      childUl.style.display = 'none';
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var open = li.classList.toggle('folder-open');
        btn.classList.toggle('folder-open', open);
        childUl.style.display = open ? 'block' : 'none';
      });
    } else {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
      });
    }
    li.replaceChild(btn, a);
  });
}

function initFullWidthClick(sidebar) {
  if (!sidebar || sidebar.dataset.clickHandler) return;
  sidebar.dataset.clickHandler = '1';
  sidebar.addEventListener('click', function(e) {
    if (e.target.closest('.sidebar-folder-button')) return;
    var li = e.target.closest('.sidebar ul li');
    if (!li) return;
    var a = li.querySelector(':scope > a[href]');
    if (a && e.target !== a && !a.contains(e.target)) { a.click(); return; }
    var btn = li.querySelector(':scope > .sidebar-folder-button');
    if (btn && e.target !== btn && !btn.contains(e.target)) btn.click();
  });
}

function openFolder(li) {
  var btn = li.querySelector(':scope > .sidebar-folder-button');
  var childUl = li.querySelector(':scope > ul');
  if (!btn || !childUl) return;
  li.classList.add('folder-open');
  btn.classList.add('folder-open');
  childUl.style.display = 'block';
}

/* Docsify writes `.active` onto the `<li>` of the page you are on, and it is
   the only reliable marker: the hrefs it renders have had `.md` stripped, so
   comparing them against `location.hash` — which keeps the extension when a
   link is followed or pasted — never matched, and every folder stayed shut.

   Walking up from `.active` also opens the whole chain of ancestors rather
   than just the one folder directly holding the page. */
function openActiveFolders() {
  var nav = document.querySelector('.sidebar-nav');
  if (!nav) return;

  var active = nav.querySelector('li.active');

  /* Nothing marked yet on the very first render; fall back to matching the
     hash with the extension and any query string taken off both sides. */
  if (!active) {
    var hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].replace(/\.md$/, '');
    var link = Array.from(nav.querySelectorAll('a[href]')).find(function(a) {
      return a.getAttribute('href').replace(/^#\/?/, '').split('?')[0].replace(/\.md$/, '') === hash;
    });
    active = link && link.closest('li');
  }

  for (var li = active; li && nav.contains(li); li = li.parentElement.closest('li')) {
    openFolder(li);
  }
}

/* Several pages fence their commands as ```console, which Prism has no grammar
   for. The contents are shell either way, so point it at bash rather than let
   those blocks fall back to no highlighting at all. */
if (window.Prism && Prism.languages.bash) {
  Prism.languages.console = Prism.languages.bash;
}

/* Palettes, in the order they appear in the picker. The empty value follows the
   reader's own system setting. Adding one means a `:root[data-theme="…"]` block
   in style.css and a row here — nothing else. */
var THEMES = [
  ['', 'System'],
  ['light', 'Light'],
  ['paper', 'Paper'],
  ['dark', 'Dark'],
  ['midnight', 'Midnight Blue'],
  ['ember', 'Ember'],
  ['forest', 'Forest'],
  ['forest-deep', 'Forest (deep)'],
  ['terminal', 'Terminal'],
  ['contrast', 'High contrast']
];

var THEME_KEY = 'xrwiki.theme';

function savedTheme() {
  try { return localStorage.getItem(THEME_KEY) || ''; } catch (e) { return ''; }
}

function systemTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(value) {
  document.documentElement.dataset.theme = value || systemTheme();
}

/* The sidebar is the only furniture that survives a route change, so the picker
   lives at the bottom of it. Docsify rebuilds the nav on navigation, which can
   take the footer with it — hence the guard and the re-add from doneEach. */
function initThemePicker() {
  var sidebar = document.querySelector('.sidebar');
  if (!sidebar || sidebar.querySelector('.sidebar-foot')) return;

  var foot = document.createElement('div');
  foot.className = 'sidebar-foot';

  var label = document.createElement('label');
  label.setAttribute('for', 'theme-select');
  label.textContent = 'Theme';

  var select = document.createElement('select');
  select.id = 'theme-select';
  THEMES.forEach(function(row) {
    var opt = document.createElement('option');
    opt.value = row[0];
    opt.textContent = row[1];
    select.appendChild(opt);
  });

  /* A palette that has since been removed falls back to following the system,
     rather than leaving the picker showing something that does not exist. */
  var saved = savedTheme();
  select.value = THEMES.some(function(row) { return row[0] === saved; }) ? saved : '';
  applyTheme(select.value);

  select.addEventListener('change', function() {
    try {
      if (select.value) localStorage.setItem(THEME_KEY, select.value);
      else localStorage.removeItem(THEME_KEY);
    } catch (e) {}
    applyTheme(select.value);
  });

  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function() {
    if (!select.value) applyTheme('');
  });

  foot.appendChild(label);
  foot.appendChild(select);
  sidebar.appendChild(foot);
}

window.$docsify.plugins = (window.$docsify.plugins || []).concat([
  function(hook) {
    hook.doneEach(function() {
      initThemePicker();
      var content = document.querySelector('.content');
      if (content) content.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      initFolders();
      openActiveFolders();
    });
    hook.mounted(function() {
      var sidebar = document.querySelector('.sidebar');
      initThemePicker();
      initFullWidthClick(sidebar);
      if (sidebar) {
        var debounceTimer;
        new MutationObserver(function() {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(function() {
            initFolders();
            openActiveFolders();
          }, 50);
        }).observe(sidebar, { childList: true, subtree: true });
      }
    });
  }
]);
