# Running the wiki

The site is a [docsify](https://docsify.js.org) page on GitHub Pages, which
serves static files and runs no code of its own. Everything collaborative about
it is therefore built on GitHub rather than on a server: **a page is a markdown
file, an edit is a commit or a pull request, and a page's moderators are the
people `CODEOWNERS` names for its path.** Nothing needs hosting, nothing needs
paying for, and the wiki's content never leaves this repository.

The moving parts:

| Feature | Where it actually lives |
| --- | --- |
| Comments | GitHub Discussions, through [giscus](https://giscus.app) |
| Editing, new pages, new folders | Commits and pull requests, through the GitHub REST API |
| Accounts and sign-in | GitHub |
| Owners and moderators | Repository permissions and `.github/CODEOWNERS` |
| Page history | `git log` |

---

## One-time setup

Steps 1–3 are the only things that cannot be done from a text editor, and
comments stay switched off until they are done. The page says so in place of
the comment box, so nothing looks broken in the meantime.

### 1. Turn on Discussions and make a category

- **Settings → General → Features → tick Discussions.**
- Go to the new **Discussions** tab → **Categories** → **New category**.
- Name it exactly **`Page comments`**.
- Set its format to **Announcement**.

The format matters. Announcement means only maintainers and giscus itself can
open a discussion, so the thread for each page is created the first time
somebody comments on it and nobody can manufacture threads that shadow a page.

If you would rather call the category something else, change `WIKI.giscus.category`
in `docs/wiki.js` to match.

### 2. Install the giscus app

Install <https://github.com/apps/giscus> and grant it access to **this
repository only**. It needs that access to write comments on people's behalf.

### 3. Fill in the category id

The repository id is already in `docs/wiki.js` and does not change. The category
id only exists once step 1 is done. Fetch it:

```sh
curl -s "https://giscus.app/api/discussions/categories?repo=XRWiki/XRWiki.github.io"
```

Copy the `id` of the `Page comments` entry — it looks like `DIC_kwDO...` — into
`docs/wiki.js`:

```js
giscus: {
  repoId: 'R_kgDORNHS7A',
  category: 'Page comments',
  categoryId: 'DIC_paste_it_here'
}
```

Commit that and comments are live on every page.

---

## Who can do what

Roles are repository permissions, so they are managed in
**Settings → Collaborators and teams** and nowhere else. The site reads whatever
GitHub reports and shows it under the reader's name in the sidebar.

| Repository permission | Shown as | What they can do |
| --- | --- | --- |
| Admin | **Owner** | Everything, including settings and moderation |
| Maintain | **Moderator** | Edit any page directly, review and merge pull requests |
| Write | **Editor** | Edit any page directly |
| Anyone else with a GitHub account | **Contributor** | Propose any change; it arrives as a pull request |

Nobody has to be given access to contribute. A signed-out reader who presses
**Edit this page** is offered either a token — which unlocks the in-page editor
— or a handoff to github.com, which forks the wiki and opens the pull request
for them. Both routes end in the same place.

### Making somebody a moderator of one section

Two steps, because they are two different things:

1. **Give them write access** under Settings → Collaborators and teams.
   Without it, a `CODEOWNERS` rule naming them is silently ignored.
2. **Name them in `.github/CODEOWNERS`** against the paths they look after.
   The file is commented; uncomment the section you want.

GitHub then requests their review automatically on any pull request touching
those paths, and the wiki prints them under **Maintainers** at the top of every
page they cover.

### Making that review compulsory

By default a code owner's review is *requested*, not *required* — anyone with
write access can still merge without it. To make it binding:

**Settings → Branches → Add branch protection rule** for `main`, then tick
**Require a pull request before merging** and **Require review from Code Owners**.

Leave this off if you would rather the team move fast; turn it on once there are
enough moderators that waiting for one is not a bottleneck.

---

## Moderating

- **A comment.** Discussions tab, or the ··· menu on the comment itself. Hiding
  or deleting it there removes it from the page. Blocking a user is
  Settings → Moderation options.
- **An edit.** It is a pull request: review it, ask for changes, merge or close.
- **A bad edit that got merged.** `git revert`, or the **History** link at the
  top of the page, which is that file's commit log.

---

## Files

| File | What it is |
| --- | --- |
| `docs/wiki.js` | The whole collaborative layer: session, editor, page and folder creation, comments |
| `docs/wiki.css` | Its styling, built only from the palette tokens in `style.css` |
| `docs/code.js` | Pre-existing: sidebar folders and the theme picker |
| `docs/_sidebar.md` | The page tree, hand-ordered — the New page flow edits it rather than regenerating it |
| `.github/CODEOWNERS` | Who moderates what |

`docs/wiki.js` starts with a `WIKI` object holding the repository, branch, docs
directory and giscus ids. If the repository is ever renamed or moved, that
object is the only thing that needs changing.

### A note on the access token

There is no server here to hold an OAuth client secret, so signing in means the
reader creates a GitHub personal access token themselves and pastes it in once.
It is stored in that browser's `localStorage`, sent to `api.github.com` and
nowhere else, and deleted by **Sign out**. The link in the dialog pre-fills the
scope as `public_repo`, which is the least that allows forking, committing and
opening a pull request on a public repository.

Nobody is obliged to create one — the github.com handoff exists precisely so
that a one-line typo fix does not require issuing a credential.

### Rate limits

A reader who is only reading makes **no** GitHub API calls: the maintainer list
comes from `raw.githubusercontent.com` and is cached for the session, and the
API is touched only when somebody actually edits. Anonymous API calls are capped
at 60 per hour per IP; signed-in ones at 5,000 per hour, so the people doing the
editing are the ones with the headroom.
