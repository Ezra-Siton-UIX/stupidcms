# AI Agent Best Practices

## Overview
This document collects tips, lessons learned, and conventions for working with AI agents (Copilot, ChatGPT, etc.) in this project.

## General Guidelines
- Always check `.github/copilot-instructions.md` for project-specific rules.
- Prefer using documentation in `docs/` for all references and explanations.
- When adding new features, document them in the relevant `docs/` subfolder.
- Use clear commit messages when updating docs or agent instructions.

## Common Pitfalls
- Do not store secrets in code or docs.
- Always update internal links when moving documentation files.
- If you encounter repeated confusion, add a note here for future reference.

## Example: Adding a New Guide
1. Create a new file in `docs/` or a subfolder (e.g., `docs/ai/`).
2. Add a summary at the top.
3. Link it from `.github/copilot-instructions.md` if it's important for agents.

## Session Learnings
- Hierarchical docs structure makes it easier for both humans and agents to find information.
- Persistent instructions in `.github/` ensure future-proofing for all AI tools.
- Use subfolders (e.g., `docs/ai/`, `docs/api/`) to organize by topic.

---

_Add more tips as the project evolves!_