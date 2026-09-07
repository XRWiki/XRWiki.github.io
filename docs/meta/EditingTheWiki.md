# Editing the Wiki

This is a wiki, so it is yours to fix. Every page has an **Edit this page**
button at the top, and you do not need to be given permission to use it — a
GitHub account is the whole requirement.

Nothing you do can break the wiki. Changes from anyone without write access
arrive as a pull request that a maintainer looks at first, and anything that
does go wrong is one `git revert` away, because the whole wiki is a git
repository.

## Fixing a page

Press **Edit this page**. You get the markdown on the left and the page as it
will actually look on the right, updating as you type.

When you are done, write one line saying what you changed and press the button
at the bottom:

- If you have write access, it says **Save to the wiki** and the change is live
  within a minute or so.
- If you do not, it says **Propose this change**. The wiki forks itself to your
  account, opens a pull request, and tells you the number. You will get a
  GitHub notification when a maintainer responds.

The first time you edit, you will be asked to connect your GitHub account. That
is a token you generate yourself and paste in once — it is kept in your browser
and nowhere else, and **Sign out** in the sidebar deletes it. If you would
rather not bother for a one-word fix, take the **Edit on github.com** button
instead: GitHub does the forking and opens the pull request for you.

## Adding a page or a folder

**New** at the top of any page.

A **page** asks for a title, which section or folder of the sidebar it belongs
in, and a filename — the filename is suggested from the other two and you can
overwrite it. A **folder** makes a new collapsible group in the sidebar and
starts it with one overview page, because an empty folder is just a button that
does nothing.

Either way the sidebar entry and the page itself are written in a single change,
so nothing lands half-added.

## Commenting

Every page has a comment box at the bottom, for the things that do not belong in
the guide itself: a build number that has since changed, a step that did not work
on your headset, a warning worth adding. Comments use your GitHub account and
live in this repository's Discussions.

If a comment turns out to be a correction, put it in the page — that is what the
Edit button is for. Comments are the conversation; the page is the answer.

## Who looks after what

The **Maintainers** line at the top of each page names the people responsible
for it. They review changes to those pages and are worth asking if you are
unsure whether an edit is wanted. Pages with nobody named are open to anyone's
proposal.

## What makes a good guide here

- Say which headsets and which builds it applies to. "Works on Quest 3" ages
  badly; a build number does not.
- Give the commands exactly, in a fenced block, in the order they are run.
- Say what the risk is where there is one, using a `> [!WARNING]` callout rather
  than burying it in a paragraph.
- Link the source — the app, the thread, the exploit — instead of describing it.
- Leave out anything you have not actually done yourself.
