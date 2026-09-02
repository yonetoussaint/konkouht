# Development Workflow

For every implementation task:

1. Understand the request.
2. Inspect the relevant existing code.
3. Retrieve missing context using relevant MCP servers.
4. Identify dependencies and affected files.
5. Implement the solution.
6. Run relevant tests, type checks, linting, or builds when available.
7. Fix problems introduced by the changes.
8. Review the final diff.

## Code Quality

- Follow existing project conventions.
- Prefer modifying existing patterns over introducing unnecessary new patterns.
- Keep changes focused on the requested task.
- Do not modify unrelated files.
- Do not leave temporary debugging code.
- Do not leave known errors without reporting them.

## Validation

Before completing a task:

- Run the most relevant available validation.
- Fix failures caused by your changes.
- Review changed files.
- Check for unintended changes.