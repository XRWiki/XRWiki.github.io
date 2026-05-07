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

function openActiveFolders() {
  var hash = window.location.hash.replace(/^#\/?/, '');
  document.querySelectorAll('.sidebar-folder-button').forEach(function(btn) {
    var li = btn.parentElement;
    var childUl = li && li.querySelector('ul');
    if (!childUl) return;
    var active = Array.from(childUl.querySelectorAll('a')).some(function(a) {
      return (a.getAttribute('href') || '').replace(/^#\/?/, '') === hash;
    });
    if (active) {
      li.classList.add('folder-open');
      btn.classList.add('folder-open');
      childUl.style.display = 'block';
    }
  });
}

window.$docsify.plugins = (window.$docsify.plugins || []).concat([
  function(hook) {
    hook.doneEach(function() {
      var content = document.querySelector('.content');
      if (content) content.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      initFolders();
      openActiveFolders();
    });
    hook.mounted(function() {
      var sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        new MutationObserver(function() {
          initFolders();
          openActiveFolders();
        }).observe(sidebar, { childList: true, subtree: true });
      }
    });
  }
]);
