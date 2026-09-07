# Running the wiki

The site is a [docsify](https://docsify.js.org) page on GitHub Pages, which
serves static files and runs no code of its own. The two things layered on top
of the guides are therefore both read-only in the browser and lean on GitHub for
the rest:

| Feature | Where it actually lives |
| --- | --- |
| Comments | GitHub Discussions, through [giscus](https://giscus.app) |
| Maintainers line | `.github/CODEOWNERS`, read from `raw.githubusercontent.com` |
| Page history | `git log`, linked out to |
| Editing | github.com — pull requests against this repository |

The wiki is not editable from the website. Nothing in `docs/wiki.js` signs
anybody in, stores a credential, or writes to the repository, and a reader who
is only reading makes no GitHub API calls at all.

---

## Comments

Already set up. The configuration is four lines at the top of `docs/wiki.js`:

```js
giscus: {
  repoId: 'R_kgDORNHS7A',
  category: 'Announcements',
  categoryId: 'DIC_kwDORNHS7M4DFGYw'
}
```

Threads are filed under the **Announcements** category, whose format only lets
maintainers and giscus open a discussion — that is the property that matters,
since it means nobody can hand-make threads that shadow a page. A thread is
created the first time somebody comments on a page.

To move comments into a category of their own, create one with the
**Announcement** format, then fetch its id and put both here:

```sh
curl -s "https://giscus.app/api/discussions/categories?repo=XRWiki/XRWiki.github.io"
```

Worth doing before threads accumulate — existing ones would have to be re-filed
by hand.

### Moderating

Discussions tab, or the ··· menu on the comment itself. Hiding or deleting it
there removes it from the page. Blocking someone is Settings → Moderation
options.

---

## The maintainers line

`.github/CODEOWNERS` decides who is named at the top of each page. Rules are
read top to bottom and **the last matching rule wins**, so the general rule goes
first and the specific ones under it:

```
*                                    @Toastconcern
docs/meta/montereyGuides/            @un-simp
```

A rule **replaces** the general one for the paths it matches rather than adding
to it, so whoever is named becomes the sole owner of that section. Put several
handles on one line to share it.

Two things to know:

- **An owner must have write access to this repository**, added under Settings →
  Collaborators and teams. Without it, GitHub ignores the rule — it will not
  request their review, though the wiki still prints their name.
- A code owner's review is **requested**, not required. To make it binding:
  Settings → Branches → branch protection for `main`, then tick *Require a pull
  request before merging* and *Require review from Code Owners*.

---

## Editing

All editing happens on github.com. Every page is a markdown file under `docs/`,
and GitHub's editor forks the repository and opens the pull request for anyone
without write access — so contributing needs no permission from you, only a
GitHub account.

Adding a page means two files in one commit: the markdown itself, and a line in
`docs/_sidebar.md` pointing at it. The sidebar is hand-ordered on purpose — the
Monterey guides run in the order you do them, which no generated listing would
reproduce.

A folder in the sidebar is an entry whose label starts with `>`:

```
* [> Quest 1 (Monterey)](meta/montereyGuides/MontereyGuides.md)
  * [Unlocking](meta/montereyGuides/unlock.md)
```

Reverting a bad change is `git revert`, or the **History** link at the top of
the page, which is that file's commit log.

---

## Files

| File | What it is |
| --- | --- |
| `docs/wiki.js` | Comments and the maintainers line |
| `docs/wiki.css` | Their styling, built only from the palette tokens in `style.css` |
| `docs/code.js` | Sidebar folders and the theme picker |
| `docs/_sidebar.md` | The page tree, hand-ordered |
| `.github/CODEOWNERS` | Who is named on which pages |

`docs/wiki.js` starts with a `WIKI` object holding the repository, branch, docs
directory and giscus ids. If the repository is ever renamed or moved, that
object is the only thing that needs changing.

### Caching

GitHub Pages serves assets with `Cache-Control: max-age=14400` — four hours. A
change to `wiki.js` or `wiki.css` will not reach anybody whose browser already
has the old copy until that expires, so **bump the `?v=` number** on its tag in
`docs/index.html` whenever you change either file. That is the whole purpose of
those query strings.
