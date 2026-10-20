# Tab Banner

A minimalist red, white, and blue tab renamer for Brave and Chrome on desktop.

## Install in Brave
1. Extract the ZIP into a folder you will keep.
2. Open `brave://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the folder containing `manifest.json`.
5. Pin Tab Banner from the extensions menu.

For Chrome, use `chrome://extensions` and the same steps.

## Use
Open a website, click Tab Banner, enter a name, choose a mode, and click **Set title**.

- **Temporarily:** applies to this tab and exact URL during the browser session, including reloads. Changing URLs ends that temporary title. Closing the tab or browser clears it.
- **For this URL:** stores a rule locally and applies it on future visits. URL matches include query strings and fragments. Brave requests access to that website so the extension can apply the title automatically.
- **Restore original title:** removes both the current temporary title and the saved rule for that URL.
- Expand **Saved titles** to remove individual rules.

Browser internal pages, the Chrome Web Store, and built-in PDF viewer pages cannot be renamed reliably. Website title changes are watched and the custom title reapplied. Competing title changes are handled on a short timer to avoid repeated title-update loops. Changes to page URLs are detected within approximately half a second.

## Privacy
Titles and associated URLs stay in local extension storage on your device. There are no network requests, analytics, accounts, or external services. Temporary rules are kept in browser-session storage. Removing a saved rule does not revoke the site permission already granted; manage site access in Brave's extension settings.

## Optional review invitation
After at least five successful manual renames and seven days since the first one, a small invitation can appear the next time you open the popup on a supported website. It asks for an honest review and links to the Chrome Web Store reviews page. It never opens a tab without your click, sends notifications, or changes the page you are browsing.

The invitation is shown only once per installation, even if you close the popup without choosing an option. **No thanks** dismisses it immediately. Timing, a rename count capped at five, and whether the invitation has been shown are stored only on your device; no usage information is sent anywhere. The counter starts with version 1.0.6; previous usage is not inferred from saved URLs.

## Develop
No build step or dependencies are needed. Download this repository using **Code → Download ZIP**, extract it, and load the folder containing `manifest.json` using the steps above.

After editing the files, reload the extension and refresh the test page. If Brave copied the unpacked extension to its own storage, remove it and load this folder again to pick up changes.

- `background.js`: local rules, optional site permissions, and tab lifecycle.
- `content.js`: changes and maintains the page title.
- `popup.html`, `popup.css`, and `popup.js`: extension interface.
- `icons/`: bundled extension icons.

## Contribute
Bug reports and pull requests are welcome. Include your browser version, steps to reproduce, expected result, and actual result. Test temporary titles, reloads, saved exact-URL rules, site access, and restoring the original title when changing behavior.

See [PRIVACY.md](PRIVACY.md) for the privacy policy.

## License
[MIT](LICENSE). Copyright © 2026 Aaron Aven.
