# Git Automation Policy

When an implementation task is successfully completed:

1. Run git status.
2. Review the files changed.
3. Review git diff when appropriate.
4. Run relevant tests or validation.
5. Do not commit secrets or credentials.
6. Do not commit .env files.
7. Stage the intended project changes.
8. Create a descriptive commit message describing the completed work.
9. Push the current branch to its configured remote.
10. Confirm whether the push succeeded.

## Safety Rules

Never:

- Use git push --force.
- Use git reset --hard.
- Use git clean -fd.
- Delete Git history.
- Commit API keys, passwords, tokens, or credentials.
- Commit .env files unless explicitly requested by the user.

If the remote branch has changed:

1. Do not force push.
2. Safely pull or rebase according to the repository's existing workflow.
3. Resolve conflicts carefully.
4. Run validation again if conflicts affected the code.
5. Push normally.

Do not create an empty commit when there are no changes.

The preferred workflow is:

Inspect → MCP context if needed → Implement → Test → Review →
Commit → Push