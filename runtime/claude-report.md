# Dreamloom Code Audit

## Summary

Dreamloom is a Tauri 2 / SvelteKit 5 / Rust project that acts as a visual CSS editor for Svelte apps. The overall architecture is coherent and the core injector path (locate → parse → apply → render) has good test coverage and is carefully designed. The main concerns are: (1) the `css_vars` backend module is entirely unimplemented stubs, yet the frontend actively calls it and displays errors to the user; (2) multiple Rust Tauri commands (`read_text_file`, `write_text_file`, `list_directory`, `inject_style`, `inject_dl_class`) accept raw file paths from the frontend with zero path-traversal or scope validation, creating a security boundary violation; (3) `commitDraftPatch` issues multiple sequential awaited `invoke` calls inside a loop, each of which writes the file individually, making N property changes cost N full disk round-trips; (4) the `named_classes` module duplicates a full CSS parser that is already implemented in `injector/parser.rs`, and duplicated markup-manipulation logic also exists in `element-classes.ts` vs `inject_class.rs`; (5) several fire-and-forget `void` async calls have no error surfacing at the call site.

---

## Issues

### [DISCIPLINE] `css_vars` backend commands are unimplemented stubs exposed in production
**File:** `backend/src/css_vars/mod.rs:4`
**Severity:** High
**Problem:** `read_css_vars`, `write_css_var`, and `delete_css_var` all return `Err("… not implemented yet")`. The fully implemented parser and writer exist in `css_vars/parser.rs` and `css_vars/writer.rs` respectively, but `mod.rs` ignores them entirely. The frontend (`cssVarsStore.svelte.ts`) calls these commands on every panel open and surfaces the error string to users.
**Fix:** Wire `mod.rs` to use the parser + writer: read the file, call `parser::parse_vars`, return results; for write/delete call `writer::write_var`/`writer::delete_var` and persist back to disk. The plumbing is already there.

---

### [SAFETY] Unrestricted filesystem access from all `fs` commands — no path validation
**File:** `backend/src/misc/fs.rs:18`, `backend/src/misc/fs.rs:158`, `backend/src/misc/fs.rs:166`
**Severity:** Critical
**Problem:** `list_directory`, `read_text_file`, and `write_text_file` accept arbitrary `String` paths from the frontend and perform filesystem operations with no scope check. The Tauri capability system (`capabilities/default.json`) grants `fs:allow-*` permissions through the plugin, but these three commands bypass the plugin entirely and use raw `std::fs`, so any path the frontend provides — including `../../../etc/passwd`, `/etc/shadow`, or any user's home directory — is reachable. Since the injector and named-class extractor also call `std::fs::write` directly on paths passed from JS, the same issue applies there.
**Fix:** Accept a project-root parameter (already available via `appState.openDirectory`) and canonicalize + validate every inbound path against the project root before operating on it. Alternatively, use Tauri's `app_scope` fs allow-list (which the plugin respects) instead of bypassing it.

---

### [SAFETY] `inject_style` and `inject_dl_class` accept arbitrary file paths
**File:** `backend/src/injector/mod.rs:135`, `backend/src/injector/inject_class.rs:48`
**Severity:** Critical
**Problem:** Both commands receive a `file_path: String` from the frontend with no canonicalization or containment check against the open project directory. A crafted `file_path` could read or overwrite any file on the host.
**Fix:** Canonicalize the path and assert it is a descendant of the currently open project directory (store it in Tauri managed state or require the frontend to pass it with every call).

---

### [SAFETY] `extract_named_class` performs two file writes with no atomicity and no rollback
**File:** `backend/src/named_classes/mod.rs:236`
**Severity:** High
**Problem:** The function writes `next_svelte` then `next_css` in two separate `std::fs::write` calls. If the process is interrupted between the two writes (crash, power loss, SIGKILL), the svelte file has been mutated but the CSS file is not yet written, leaving the project in an inconsistent state (dl-* rules deleted from `.svelte` but not yet added to `dreamloom.css`).
**Fix:** Write both files atomically using temp-file + rename, or at minimum write the CSS first (additive) before deleting the dl rules from the svelte file (destructive).

---

### [DISCIPLINE] `named_classes/mod.rs` duplicates the full CSS parser from `injector/parser.rs`
**File:** `backend/src/named_classes/mod.rs:60`
**Severity:** High
**Problem:** `named_classes/mod.rs` contains `parse_rules`, `render_rules`, `find_style_block`, `find_dreamloom_region`, and `detect_newline` — all of which duplicate logic that already exists in `backend/src/injector/parser.rs` and `backend/src/injector/writer.rs`. The duplicated parser has subtly different behavior (e.g., no comment-skipping loop in the selector scan on line 65–69 vs the injector's approach), which can lead to divergent results.
**Fix:** Re-use `crate::injector::parser` and `crate::injector::writer` from the named-classes module.

---

### [DISCIPLINE] `parse_github_remote` is duplicated in `auth/git_status.rs` and `git/mod.rs`
**File:** `backend/src/auth/git_status.rs:31`, `backend/src/git/mod.rs:32`
**Severity:** Medium
**Problem:** An identical `parse_github_remote` function exists in both modules, byte-for-byte identical. Any bug fix to one will silently leave the other broken.
**Fix:** Move to a shared `crate::misc::git_helpers` module and import in both locations.

---

### [DISCIPLINE] `http_client()` is duplicated in `auth/device_flow.rs` and `auth/github_api.rs`
**File:** `backend/src/auth/device_flow.rs:38`, `backend/src/auth/github_api.rs:29`
**Severity:** Low
**Problem:** Identical `fn http_client()` building a reqwest client with `user_agent("dreamloom")` appears in both files.
**Fix:** Lift into `auth/mod.rs` or a shared `auth/http.rs`.

---

### [DISCIPLINE] `fetch_profile` and `fetch_repos` both call `github_oauth_config()` and discard the result
**File:** `backend/src/auth/github_api.rs:37`, `backend/src/auth/github_api.rs:67`
**Severity:** Low
**Problem:** Both functions call `let _ = github_oauth_config()?;` at their start, triggering the side effect of loading `.env`, but the config value is discarded. The functions do not use `client_id` or `client_secret` — only the bearer token passed as a parameter. The `github_oauth_config()` call is therefore a pointless side-effect-only invocation that will fail if `GITHUB_CLIENT_ID` is not set even when only reading the user profile.
**Fix:** Remove these calls from `fetch_profile` and `fetch_repos`. If `.env` loading is needed, call it explicitly at startup.

---

### [BUG] Device flow poll does not check HTTP status before parsing JSON
**File:** `backend/src/auth/device_flow.rs:106`
**Severity:** Medium
**Problem:** After posting to `/login/oauth/access_token`, the response status is never checked before calling `.json()`. A 4xx/5xx from GitHub will either produce a garbled `TokenResponse` (if the error body happens to be JSON with matching fields) or a parse error masquerading as an unrelated failure.
**Fix:** Add `if !response.status().is_success() { ... return Err(...) }` before the `.json()` call, matching the pattern used in `start_device_flow`.

---

### [BUG] `github_get_session` returns `authenticated: true` when profile fetch fails
**File:** `backend/src/auth/mod.rs:129`
**Severity:** Medium
**Problem:** If `fetch_profile` fails (network error, revoked token, rate limit), the catch arm returns `GithubSessionDto { authenticated: true, login: None, avatar_url: None }`. The frontend in `authStore.svelte.ts:93` then treats `authenticated: true` but no `login` as still authenticated, shows the cached profile, and calls `refreshRepoMetrics()` — meaning a revoked token silently presents the user as logged in.
**Fix:** On `fetch_profile` error, return `authenticated: false` (or a new status `"token_invalid"`) so the frontend can clear the cached profile.

---

### [SAFETY] `add_class_to_markup` in `named_classes/mod.rs` uses a bare substring search
**File:** `backend/src/named_classes/mod.rs:181`
**Severity:** High
**Problem:** `content.find(needle)` (where `needle` is `dl_class`, e.g. `"dl-a1b2"`) will match the *first* occurrence of that string anywhere in the file — including in a comment, a string literal, a CSS value, or the wrong element — not just in a `class=` attribute. If the dl class appears in a `<style>` block comment or a string before the markup element, the function will corrupt an unrelated part of the file.
**Fix:** Use the same `find_opening_tags` / `authored_classes` logic from `inject_class.rs` to locate the element structurally rather than by substring.

---

### [BUG] `add_class_to_markup` offset calculation is wrong when `tag_start` != `pos - (pos - tag_start)`
**File:** `backend/src/named_classes/mod.rs:198`
**Severity:** High
**Problem:** The function computes `class_pos` relative to `tag` (a slice of `content`), then uses `tag_start + value_start` and `tag_start + value_end` as absolute offsets into `content`. However, `tag` is `content[tag_start..=tag_end]`, so `class_pos` is already relative to `tag_start`. Adding `tag_start` twice would be wrong. The code uses `let abs_start = tag_start + value_start` where `value_start` is `quote_start + 1`, and `quote_start` is `class_pos + "class=".len()`. Since `tag = &content[tag_start..=tag_end]`, all these indices are relative to `tag_start`, so `tag_start + value_start` correctly yields absolute offset. This is subtly correct but brittle. More importantly, `tag` includes the `=tag_end` inclusive bound but the standard Rust slice is exclusive, meaning `&content[tag_start..=tag_end]` is correct (inclusive), yet the subsequent absolute offset math adds tag_start to a relative offset, which is correct. The real problem is when the class value contains `>` — `tag_end` is found by `content[pos..].find('>')` without quote-awareness, so a class value like `class="a > b"` will truncate `tag` too early, corrupting the write.
**Fix:** Use a quote-aware `>` finder (already implemented in `inject_class.rs`'s `tag_end`).

---

### [DISCIPLINE] `commitDraftPatch` issues N sequential file writes for N property changes
**File:** `frontend/src/injector/index.ts:101`
**Severity:** High
**Problem:** `commitDraftPatch` iterates `Object.entries(patch)` and awaits `commitPropertyChange` for each entry sequentially. Each `commitPropertyChange` triggers a round-trip: read file → parse → apply → write. For a patch of N properties this means N×(read+write) disk operations on the same file, each time re-reading what was just written. On HDD or network mounts this is extremely slow; it also risks a race if the file is modified between iterations.
**Fix:** Accept the full patch in a single backend command (or batch in TS: read once, apply all deltas to the in-memory `Stylesheet`, write once).

---

### [BUG] `injectSvelteStyle` silently swallows all errors
**File:** `frontend/src/injector/strategies/svelte.ts:8`
**Severity:** High
**Problem:** The catch block logs a message saying "command not implemented yet" for every error, including real failures like file not found, permission denied, or malformed CSS. A user editing a property that fails to write receives no feedback.
**Fix:** Distinguish "not implemented" (e.g., check `err.kind === 'not_implemented'` if such a variant were added) from real errors. Re-throw or surface real errors to the UI.

---

### [BUG] The `css_vars` frontend store calls `write_css_var` but expects it to return `vars` array
**File:** `frontend/src/cssVars/cssVarsStore.svelte.ts:136`
**Severity:** High
**Problem:** `persistCssVar` calls `invoke<{ name: string; value: string }[]>("write_css_var", ...)` expecting the command to return the updated variable list. But the current `write_css_var` stub returns `Err(...)`, and even when eventually implemented, the backend signature returns `Result<(), String>` not `Result<Vec<(String, String)>, String>`. The frontend will always fail or get a wrong type.
**Fix:** Align the return type: either have the backend return the updated vars list, or have the frontend call `read_css_vars` after a successful write.

---

### [SAFETY] `postToPreview` sends `postMessage` with `targetOrigin: "*"`
**File:** `frontend/lib/preview-messaging.ts:18`
**Severity:** Medium
**Problem:** `win.postMessage(message, "*")` sends messages to the preview iframe with a wildcard origin. Messages of type `dreamloom:pick` or `dreamloom:highlightDl` could potentially be intercepted or spoofed if the iframe navigates to a different origin.
**Fix:** Use `postMessage(message, previewBaseUrl(port))` with the known origin. The port is available when this function is called.

---

### [SAFETY] Bridge script uses `parent.postMessage(…, "*")` — no origin restriction
**File:** `frontend/panels/center/preview-bridge.ts:213`
**Severity:** Medium
**Problem:** All `parent.postMessage` calls in the injected bridge script use `"*"` as the target origin. If the Dreamloom shell window is embedded (unlikely but possible) or another frame is present, the messages could be captured by unintended receivers. More importantly, the bridge accepts any incoming `message` events without checking `event.origin`, meaning a malicious page on the dev server could send `dreamloom:pick` or `dreamloom:config` messages.
**Fix:** In the bridge's `window.addEventListener("message", ...)`, validate `e.origin` against `window.location.origin` before processing any command. Use the injected `<base href>` origin as the known-good origin.

---

### [BUG] `find_free_port` returns hardcoded fallback `5173` on error
**File:** `backend/src/live_preview/port.rs:7`
**Severity:** Medium
**Problem:** If `TcpListener::bind` fails (extremely rare but possible), the function silently falls back to port `5173`, which is Vite's default. This could collide with an already-running Vite instance on the host, resulting in the dev server silently using the wrong port or failing to start.
**Fix:** Return `Result<u16, String>` and propagate the error rather than using a fallback.

---

### [BUG] `start_dev_server` holds the Mutex lock for up to 60 seconds
**File:** `backend/src/live_preview/state.rs:49`
**Severity:** High
**Problem:** `DevServer::start` acquires the `child` mutex lock to store the child handle, then immediately calls `wait_for_port(port, Duration::from_secs(60))` while the mutex is *not* held (the lock guard is dropped after the `= Some(child)` assignment). However, the second `self.child.lock()` call on line 49 is inside the same scope as `self.stop()` on line 33, which also acquires the mutex. The flow is: `self.stop()` (acquires + releases lock), `find_free_port()`, `spawn_dev_server()`, second `self.child.lock()` (acquires lock, stores child, releases lock), then `wait_for_port(60s)`. The 60-second `wait_for_port` is called after releasing the lock, so concurrent `stop()` or `start()` calls during startup can race. If `stop()` is called while `wait_for_port` is running, the child handle is taken and killed, but `wait_for_port` will then time out at 60 seconds before returning an error.
**Fix:** After `wait_for_port` fails, kill the child (if still running) and return the error immediately. Or hold the mutex for the entire start sequence using a different synchronization approach (e.g., `RwLock` + a separate `starting` state).

---

### [BUG] `list_child_directories_by_github_push` runs one `git log` command per remote branch — O(branches) git invocations
**File:** `backend/src/misc/fs.rs:99`
**Severity:** Medium
**Problem:** For each directory, `last_github_push_unix` runs `git for-each-ref` then runs `git log -1 --format=%ct <branch>` for every remote-tracking branch. For a repo with 50 remote branches, this is 51 subprocess invocations per directory. If the working folder contains 20 repos, this is over 1000 `git` subprocess calls on welcome screen load.
**Fix:** Use `git for-each-ref --format=%(refname:short) %(creatordate:unix) refs/remotes/origin` to get both the branch name and commit timestamp in one call.

---

### [EDGE_CASE] `cachedSveltePaths` in `resolve-component-source.ts` is never invalidated
**File:** `frontend/lib/resolve-component-source.ts:11`
**Severity:** Medium
**Problem:** `cachedSveltePaths` is a module-level variable that caches the list of `.svelte` files in the project. It is only invalidated when the `root` changes (i.e., a different project is opened). If new `.svelte` files are created while the project is open, they will never appear in source resolution until the project is reopened.
**Fix:** Invalidate the cache on file-tree changes (file create/rename events) or add a TTL. At minimum document the limitation.

---

### [EDGE_CASE] `getSveltePaths` uses `await join(dir, entry.name)` inside a loop — N async calls per directory
**File:** `frontend/lib/resolve-component-source.ts:89`
**Severity:** Medium
**Problem:** `collectSveltePaths` calls `await join(dir, entry.name)` for every entry in every directory. `@tauri-apps/api/path`'s `join` is an async IPC call. For a project with 200 files across 30 directories, this creates ~230 IPC round-trips just to build the path list.
**Fix:** Use simple string concatenation (`${dir}/${entry.name}`) or use the synchronous path utilities where available, since path joining does not need to go to the Rust backend.

---

### [OPTIMIZATION] `readDirectoryEntries` in `file-tree.ts` also uses `await join` in a loop
**File:** `frontend/lib/file-tree.ts:41`
**Severity:** Medium
**Problem:** Same pattern as above — `await join(dirPath, entry.name)` for every entry in the directory listing. This is an async IPC call used only for string path manipulation.
**Fix:** Use `${dirPath}/${entry.name}` directly or the synchronous path module.

---

### [DISCIPLINE] `writeNamedClassProperty` in `extractClass.ts` re-reads and re-writes the entire `dreamloom.css` file for every single property change
**File:** `frontend/src/namedClasses/extractClass.ts:154`
**Severity:** High
**Problem:** Every call to `writeNamedClassProperty` invokes `read_text_file`, runs `parseRules`, mutates the in-memory representation, calls `renderRules`, and invokes `write_text_file`. This means every keystroke on a named class property triggers a full file read-parse-write cycle. There is also no debouncing; rapid input events will queue many concurrent or sequential writes.
**Fix:** Debounce writes (e.g., 300 ms after last change) and/or maintain an in-memory dirty buffer that is flushed on blur/save.

---

### [DISCIPLINE] `refreshCssVars` in `CssVarsPanel.svelte` is triggered by a bare `appState.openDirectory` dependency in `$effect`
**File:** `frontend/src/panels/CssVarsPanel.svelte:16`
**Severity:** Low
**Problem:** The `$effect` block reads `appState.openDirectory` on line 17 and immediately calls `void refreshCssVars()` — this is a Svelte 5 reactive pattern but reading the state inside `$effect` without using its value is a code smell. The intent is to re-run when the directory changes, but the silent `void` discard means any error from `refreshCssVars` is swallowed at this call site (the store sets `cssVarsStore.error` internally, so it's not completely invisible, but still).
**Fix:** This is minor but consider using `$effect(() => { if (appState.openDirectory) void refreshCssVars(); })` to make intent clearer.

---

### [BUG] `saveCssVarRow` can delete the old variable and then fail to create the new one, leaving data lost
**File:** `frontend/src/cssVars/cssVarsStore.svelte.ts:190`
**Severity:** High
**Problem:** When renaming a variable, `saveCssVarRow` calls `removeCssVar(previousName)` first, then `persistCssVar(normalized, nextValue)`. If the second call fails (backend error), the old variable has been deleted but the new one was never written. The variable is silently lost.
**Fix:** Use the backend to perform the rename atomically (delete + insert in one write call), or on the frontend retry / roll back the delete if the subsequent write fails.

---

### [EDGE_CASE] `parseGitignore` in `gitStore.svelte.ts` strips all comment lines including shebangs and blank lines
**File:** `frontend/src/git/gitStore.svelte.ts:51`
**Severity:** Low
**Problem:** `parseGitignore` filters out lines starting with `#` (correct) and blank lines. When `serializeGitignore` reconstructs the file, all comments and blank lines are lost permanently. A user's commented-out patterns or section comments in `.gitignore` are silently deleted on first save through Dreamloom.
**Fix:** Either preserve comments during round-trip (store raw lines, only filter for the existence check), or warn the user that existing comments will be removed.

---

### [BUG] `buildCommitMessage` appends the undo log footer with `---` separator even when `commitMessage` is empty
**File:** `frontend/src/git/gitStore.svelte.ts:220`
**Severity:** Low
**Problem:** When `user` is empty and `footer` is non-empty, the generated commit message is `---\nDreamloom session:\n${footer}`, which starts with a `---` separator. Git and GitHub display this as an unusual commit message format; the first line becomes the summary line in commit history.
**Fix:** When there is no user message, use `footer` directly as the commit message, or at least use the first line of the footer as the summary.

---

### [DISCIPLINE] `lastHighlight` in `element-highlight.ts` is a module-level mutable variable shared across all editor instances
**File:** `frontend/lib/codemirror/element-highlight.ts:18`
**Severity:** Medium
**Problem:** `let lastHighlight: ElementHighlightRange = null` is module-level state. If multiple CodeMirror editor instances exist (possible in future), they share this state and will interfere with each other's highlight tracking. `applyElementHighlight` uses it as a diff-suppression guard, so one editor's update can suppress another's.
**Fix:** Store `lastHighlight` inside the `StateField` (in `StateField.create`) so it is per-instance, or encapsulate it in a closure returned by `elementHighlightExtension()`.

---

### [SAFETY] `is_safe_relative_path` in `asset_scanner.rs` does not canonicalize the path
**File:** `backend/src/misc/asset_scanner.rs:44`
**Severity:** Medium
**Problem:** `is_safe_relative_path` checks for leading `/` and `..` components by splitting on `/`, but does not handle encoded sequences, Windows-style `\` separators (normalized in the input but not in URL-encoded form), or paths that become `..` after Unicode normalization. More critically, the function is only called for the `relative_path` argument, not for the `category` argument. A `category` of `"../passwords"` would bypass the `CATEGORY_FOLDERS` allowlist check — wait, actually `CATEGORY_FOLDERS.contains(&category)` does check the category, so this specific attack is blocked. However, the relative path check is still weak for double-encoded sequences.
**Fix:** After building `file_path`, canonicalize it and assert it starts with `project_root.join("assets").join(category)`.

---

### [DISCIPLINE] `detect_newline` is duplicated in three separate modules
**File:** `backend/src/injector/parser.rs:57`, `backend/src/css_vars/parser.rs:23`, `backend/src/named_classes/mod.rs:30`
**Severity:** Low
**Problem:** An identical `detect_newline(content: &str) -> &'static str` function exists in three places.
**Fix:** Move to `crate::misc` or a shared utility module.

---

### [EDGE_CASE] CSS variable name `--` prefix normalization in the frontend does not validate content
**File:** `frontend/src/cssVars/cssVarsStore.svelte.ts:64`
**Severity:** Low
**Problem:** `normalizeVarName` prepends `--` if missing, but does not validate that the result is a syntactically valid CSS custom property name. Names like `-- ` (with a space), `--a:b`, or `--a{b` would be accepted and written to the file, potentially breaking the CSS parser on next read.
**Fix:** Add a regex validation: `^--[a-zA-Z_][\w-]*$` (or at minimum strip/reject whitespace and special characters).

---

### [BUG] `VarRow.svelte` calls `onDelete(entry.name)` but also fires `onblur commit` on the value input
**File:** `frontend/src/panels/cssVars/VarRow.svelte:97`
**Severity:** Medium
**Problem:** The delete button calls `onDelete(entry.name)`. However, if the user is currently editing the value field and then clicks the delete button, the focus change fires `onblur` on the value input, which calls `commit()`, which calls `onSave(entry.name, draftName, draftValue)`. Depending on timing, this may save the variable *and then* delete it, or save after delete causing a re-create.
**Fix:** In `commit()`, check if the component is still mounted / the entry hasn't been deleted. Or cancel editing explicitly before delete.

---

### [BUG] `openCenterTab` loads tab content and then calls `focusCenterTab` — double load possible
**File:** `frontend/lib/center-tabs.svelte.ts:133`
**Severity:** Medium
**Problem:** `openCenterTab` calls `loadTabContent(tab)` (which sets `tab.content`), then appends to `tabs`, then calls `focusCenterTab`. `focusCenterTab` also checks `if (tab.evicted || tab.content === null)` and calls `loadTabContent` if true. Between the first `loadTabContent` call and the `focusCenterTab` call, the tab is not yet in `centerTabs.tabs`, so another effect or component cannot evict it — but the ordering means `loadTabContent` runs twice in theory if `tab.content` were to be reset between the two calls (e.g., by an eviction timer firing on another tab that then somehow affects this one — unlikely but worth noting).
**Fix:** This is low-risk but the logic could be simplified by appending to tabs first, then letting `focusCenterTab` handle the load.

---

### [DISCIPLINE] The preview bridge script is a minified inline string — difficult to maintain and test
**File:** `frontend/panels/center/preview-bridge.ts:92`
**Severity:** Medium
**Problem:** The entire ~230-line preview bridge JavaScript is stored as a hand-minified template string in a TypeScript file. There is no build step to minify it, no type checking, no linting, no unit tests. Bugs in this code (e.g., the `signatureOccurrence` function, the `buildDomTree` function) are hard to find and reproduce.
**Fix:** Store the bridge as a separate `.js` file, process it through a build step (esbuild/terser), and add at minimum a smoke-test that the injected HTML contains the expected markers.

---

### [EDGE_CASE] `buildDomTree` in bridge script uses a module-level `nodeCount` reset on every click
**File:** `frontend/panels/center/preview-bridge.ts:282`
**Severity:** Medium
**Problem:** `nodeCount` is reset to 0 at the start of each click handler. If two clicks arrive in quick succession (e.g., double-click), the first `buildDomTree` call's count is reset by the second click handler before the first has finished (since JS is single-threaded this is not a race, but DOM event batching can cause rapid sequential resets). More importantly, `nodeCount` is a shared outer variable — if `buildDomTree` is ever called from a context other than the click handler (e.g., `pickAt`), it won't reset `nodeCount`, so subsequent builds will immediately hit `MAX_NODES`.
**Fix:** Pass `nodeCount` as a local parameter rather than a shared outer variable, or reset inside `buildDomTree` itself.

---

### [EDGE_CASE] `injectPreviewHead` uses case-insensitive `html.toLowerCase()` index but splices the original string
**File:** `frontend/panels/center/preview-bridge.ts:321`
**Severity:** Low
**Problem:** `lower.indexOf("</head>")` finds the index in the lowercased string, then uses that index to splice `html` (the original). This is correct as long as the string contains only ASCII or the characters before `</head>` have the same byte-length in upper and lower case. For UTF-8 strings where multi-byte characters appear before `</head>`, `toLowerCase()` could produce a string of different byte length (unlikely for HTML but possible for exotic content), making the splice index incorrect.
**Fix:** Use a case-insensitive regex match on the original string: `/(<\/head>)/i.exec(html)` and use `match.index`.

---

### [DISCIPLINE] `escapeRegExp` is defined in both `find-element-lines.ts` and `element-classes.ts`
**File:** `frontend/lib/find-element-lines.ts:3`, `frontend/lib/element-classes.ts:5`
**Severity:** Low
**Problem:** Identical `escapeRegExp` function defined in two files. Not harmful but violates DRY.
**Fix:** Move to a shared utility module (e.g., `frontend/lib/utils.ts`).

---

### [DISCIPLINE] `allocateDlClass` in `primitives/index.ts` duplicates `generateDlClass` from `element-classes.ts`
**File:** `frontend/src/primitives/index.ts:52`
**Severity:** Low
**Problem:** `allocateDlClass` generates `dl-el-N` suffixes sequentially; `generateDlClass` generates 4-char random alphanumeric tokens. Both serve the same purpose (generate a unique dl-* class not already in source). Having two separate generators means the naming scheme is inconsistent (some elements get `dl-a1b2`, others get `dl-el-42`).
**Fix:** Use `generateDlClass` from `element-classes.ts` everywhere, or explicitly document that primitives use a different naming scheme.

---

### [EDGE_CASE] `settings.inactiveEvictionDelay` change does not reschedule already-pending timers
**File:** `frontend/lib/center-tabs.svelte.ts:74`
**Severity:** Low
**Problem:** `scheduleEviction` captures `settings.inactiveEvictionDelay` at the moment it's called. Changing the delay in settings calls `rescheduleAllEvictions()` only when the settings modal is saved, not reactively. Timers already in the `evictionTimers` map with the old delay will fire at the old time.
**Fix:** `rescheduleAllEvictions()` is already called from `closeAndSave()` in `SettingsModal.svelte` — this is acceptable. Document it as expected behavior.

---

### [SAFETY] The `git_stage` command passes file paths directly as `git add --` arguments without validation
**File:** `backend/src/git/mod.rs:199`
**Severity:** Medium
**Problem:** `git_stage` and `git_unstage` take `files: Vec<String>` from the frontend and append them directly as `git add -- <file>` arguments. A crafted path like `../../../malicious-script.sh` or a path outside the repository could cause unintended `git add` operations. While the `ensure_repo` check verifies the project path is a git repo, the individual file paths are not validated to be within the repo.
**Fix:** Validate that each file path, when joined with the project path, resolves to a path within the project directory.

---

### [BUG] `git_commit` uses `unwrap_or` on path conversion with a fallback that may point to the wrong location
**File:** `backend/src/git/mod.rs:235`
**Severity:** Low
**Problem:** `msg_path.to_str().unwrap_or(".git/DREAMLOOM_COMMIT_MSG")` — the fallback is a relative path string `.git/DREAMLOOM_COMMIT_MSG`, which would be relative to the current working directory of the spawned `git` process, not the project directory. In practice `to_str()` almost never fails on a valid path, but the fallback is wrong.
**Fix:** Use `msg_path.to_str().ok_or("commit message path is not valid UTF-8")?` to propagate the error.

---

### [DISCIPLINE] `loadLayout()` is called synchronously at module load time
**File:** `frontend/lib/layout.svelte.ts:9`
**Severity:** Low
**Problem:** `export const layout = $state<PanelLayout>(loadLayout())` calls `loadLayout()` synchronously at import time. `loadLayout` accesses `localStorage` which is fine in a browser context but fails gracefully on SSR. The `ssr = false` flag in `+layout.ts` prevents this from being an issue today, but any future SSR enablement would break this.
**Fix:** Acceptable as-is given `ssr = false`, but document the dependency.

---

### [DISCIPLINE] `propertiesPseudo.collapsed` is initialized from `localStorage` at module load — same SSR concern
**File:** `frontend/properties/properties-pseudo.svelte.ts:10`
**Severity:** Low
**Problem:** `collapsed: loadStateSelectorCollapsed()` calls into `localStorage` synchronously at module import. Same issue as `layout.svelte.ts`.
**Fix:** Same mitigation — acceptable given `ssr = false`.

---

### [EDGE_CASE] `find_matching_close` in the CSS vars parser returns `None` when a nested `{` is encountered
**File:** `backend/src/css_vars/parser.rs:103`
**Severity:** Medium
**Problem:** `find_matching_close` returns `None` if it encounters an inner `{`. This means a `:root` block containing a nested block (e.g., `@supports {}` or a malformed rule) will cause `locate_root` to return `Err("':root block is not closed'")` even if the outer `}` exists. While nested blocks inside `:root` are unusual, they could appear in user-authored files and will cause all css-vars operations to fail with a confusing error.
**Fix:** Implement proper brace nesting tracking: increment a depth counter on `{` (skip the first open) and decrement on `}`, returning when depth hits zero.

---

### [EDGE_CASE] `writeNamedClassProperty` in `extractClass.ts` resets ALL rules on every write
**File:** `frontend/src/namedClasses/extractClass.ts:172`
**Severity:** Medium
**Problem:** `const nextRules = rules.filter((entry) => Object.keys(entry.declarations).length > 0)` removes all rules with no declarations. If a named class has an empty rule (e.g., a selector placeholder with no properties yet), clearing a property removes it entirely. This may silently delete rules the user intended to keep.
**Fix:** This is likely intentional cleanup, but it should be documented. Alternatively, keep empty rules as placeholders.

---

### [EDGE_CASE] `find_style_element` only finds the *first* `<style>` element in the file
**File:** `backend/src/injector/parser.rs:175`
**Severity:** Low
**Problem:** `content.find("<style")` finds the first occurrence. Svelte components are expected to have only one `<style>` block, but if a user has authored a second (e.g., `<style global>` followed by `<style>`), the injector will always operate on the first one.
**Fix:** Document that only the first `<style>` is supported, and emit a warning if multiple are detected.

---

### [EDGE_CASE] `MAX_PROJECT_READS = 200` cap in `resolve-component-source.ts` silently stops searching
**File:** `frontend/lib/resolve-component-source.ts:9`
**Severity:** Low
**Problem:** When a project has more than 200 `.svelte` files, source resolution silently gives up after reading 200 of them, returning `null`. The user sees no selection highlighting and no error.
**Fix:** Log a warning when the cap is hit, or increase the cap substantially. The limiting factor is IPC round-trips, not memory, so increasing to 1000 would be reasonable once `await join` is replaced with synchronous path joining.

---

### [DISCIPLINE] `RightTabs.svelte` uses a dynamic `import()` for `CssVarsPanel` only when tab is active
**File:** `frontend/misc/RightTabs.svelte:32`
**Severity:** Low
**Problem:** The dynamic import with `{#await import(...)}` means the CssVarsPanel is loaded anew from the module cache on every tab switch to "cssVars" — but since Svelte/Vite caches the module, the component is not recreated. However, the `#await` means there is a brief undefined-state flash on every tab switch until the module resolves (typically immediate from cache, but not guaranteed). More importantly, if the import fails, the `:catch` block just shows an error paragraph — acceptable, but the component path is fragile.
**Fix:** This is acceptable but consider using a static import since the module is part of the same bundle.

---

### [DISCIPLINE] `disconnectGithub` does not clear `repoMetrics` immediately on error
**File:** `frontend/src/auth/authStore.svelte.ts:221`
**Severity:** Low
**Problem:** `disconnectGithub` calls `clearSession()` in a try/catch that swallows errors, then unconditionally clears local state. This is correct. But there's no check: if the user is offline, `clearSession()` fails silently, the local state is cleared, but the server-side token remains valid. The user appears logged out in the UI but the GitHub token can still be used.
**Fix:** This is an inherent limitation of local-only logout — acceptable for a desktop app. Consider logging the error at least.

---

### [DISCIPLINE] `StatusBar.svelte` calls `fetchBuildInfo()` on every component mount via `$effect`
**File:** `frontend/misc/StatusBar.svelte:51`
**Severity:** Low
**Problem:** `$effect` calls `fetchBuildInfo()` unconditionally on mount (and on any reactive dependency change, though there are none). `get_build_info` reads `/proc/cpuinfo` and `/proc/meminfo` (on Linux) or calls `sysctl` (on macOS) synchronously in Rust. While inexpensive, this is called on every StatusBar render. The version label should be stable for the lifetime of the app.
**Fix:** Call `fetchBuildInfo()` once at app startup (in `+layout.svelte`) and store the result in `appState` or a module-level store.

---

### [DISCIPLINE] Named module `$git` imports from `gitStore.svelte` but some callers import `gitApi.ts` directly
**File:** `frontend/src/git/gitStore.svelte.ts:1`, `frontend/misc/StatusBar.svelte:6`
**Severity:** Low
**Problem:** `StatusBar.svelte` imports `openGitModal` from `$git/gitStore.svelte`, but also imports `refreshRepoMetrics` from `$auth/authStore.svelte`. The git store re-exports `refreshRepoMetrics` indirectly via `commitOnly` and `commitAndPush`, but `refreshRepoMetrics` itself lives in `authStore`. This creates a cross-concern dependency (git store → auth store) that complicates future refactoring.
**Fix:** This is a minor architectural note. Consider moving `repoMetrics` state into the git store or creating a shared project-state store.

---

### [EDGE_CASE] `add_class_to_tag` in `inject_class.rs` uses `rfind('>')` which could find a `>` inside a comment
**File:** `backend/src/injector/inject_class.rs:342`
**Severity:** Low
**Problem:** When no `class=` attribute is found, `let gt = tag_text.rfind('>').unwrap_or(tag_text.len())` finds the last `>` in the tag text. If the tag text contains a `>` inside an attribute value that `tag_end()` should have already consumed (unlikely, since the tag text is bounded by `tag_end`'s output), this could point to the wrong location. In practice `tag_end` is quote-aware so the tag text should not contain a stray `>`. Low risk.
**Fix:** No action required; document the pre-condition.

---

### [EDGE_CASE] `CSS_VAR_PATTERN` regex in `cssVarsStore.svelte.ts` matches variables outside `:root`
**File:** `frontend/src/cssVars/cssVarsStore.svelte.ts:22`
**Severity:** Low
**Problem:** `/(--[\w-]+)\s*:\s*([^;}\n]+)/g` will match any CSS custom property declaration anywhere in the file, not just inside `:root`. This function (`parseCssVariables`) appears to be unused in the current active code path (the backend `read_css_vars` is the intended source), but it remains in the module and could produce incorrect results if called.
**Fix:** Either remove the unused function or restrict it to the `:root` block.

---

### [DISCIPLINE] Deleted files `frontend/lib/recent-repos.ts` and `frontend/lib/recent-repositories.ts` are listed as deleted in git status but may still be imported
**File:** `frontend/lib/recent-repos.ts` (deleted), `frontend/lib/recent-repositories.ts` (deleted)
**Severity:** Low
**Problem:** These files are shown as `D` (deleted) in the git working tree. Any remaining imports of these modules will cause build failures. The git status also shows `D frontend/src/cssVars/cssVarsStore.ts` — if anything still imports the old path vs the new `cssVarsStore.svelte.ts`, it will break.
**Fix:** Run `grep -r "recent-repos\|recent-repositories\|cssVars/cssVarsStore'" frontend/` to verify no lingering imports.

---

### [DISCIPLINE] `backend/src/app/setup.rs` only creates the logs directory — all other app initialization is missing
**File:** `backend/src/app/setup.rs:5`
**Severity:** Low
**Problem:** `setup::configure` is the Tauri `setup` hook, normally the place to initialize all app-wide state (window setup, tray icon, deep links, etc.). Currently it only creates the logs directory and allows it in the FS scope. As the app grows, initialization logic risk accumulates in `app/mod.rs`'s `run()` directly (e.g., `DevServer::default()` is passed inline to `manage()`).
**Fix:** Minor structural note. As the app grows, move managed state initialization into `setup.rs` for maintainability.

---

### [EDGE_CASE] The toggle primitive template contains inline Svelte event handler syntax (`onclick={(event) => {...}}`) which is not valid in non-Svelte files
**File:** `frontend/src/primitives/templates/svelte.ts:120`
**Severity:** Medium
**Problem:** The `toggle` template renders an inline Svelte `onclick` event handler using `{...}` syntax. This is valid Svelte markup, but the snippet is inserted as raw text. If a user inserts the toggle primitive into a `.svelte` file, Svelte will attempt to compile the `onclick` handler — which contains a template literal calling `button.querySelector("[data-dl-toggle-track]")` — and may encounter parse errors or runtime issues depending on whether Svelte treats the handler as a Svelte expression. Additionally, the `onclick` handler modifies inline `style` directly, bypassing Svelte's reactivity entirely.
**Fix:** Extract the toggle's behavior to a Svelte `<script>` snippet or use a proper bound action rather than an inline DOM-mutating handler.
