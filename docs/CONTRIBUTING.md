# Contributing to Puppetflow

Puppetflow welcomes focused fixes, useful improvements, and clear bug reports.

Before starting a large change, open an issue or discussion first. This avoids spending time on work that does not fit the project's direction or duplicates something already in progress.

## What makes a good contribution

A contribution should:

- Solve a concrete problem
- Stay focused on one subject
- Follow the patterns already used in the codebase
- Keep user-facing behavior clear and predictable
- Avoid unrelated refactoring
- Explain why the change is needed

Small pull requests are easier to review and safer to merge.

## No AI Slop Policy

Do not submit generated output you have not read, understood, and verified.

Using an AI assistant does not transfer responsibility away from the contributor. If you submit a change, you must be able to explain its behavior, defend its design, and maintain it after review.

Pull requests may be rejected when they contain:

- Large speculative rewrites with no demonstrated need
- Invented abstractions or dependencies
- Generic comments and documentation that add no useful information
- Code that looks plausible but does not match the application
- Unrelated generated files or formatting churn
- Claims that were not checked against the code

The standard is simple: submit work you understand and would be comfortable maintaining yourself.

## Development setup

Complete [Get the source](INSTALL.md#1-get-the-source) and [Configure the installation](INSTALL.md#2-configure-the-installation). Keep the localhost URLs from `.env.minimal.example`.

Start the development stack and apply the migrations:

```bash
docker compose up -d --build
docker compose exec app php artisan migrate --force
```

The application is available at `http://localhost:8000`, and Vite runs on port `5173`. An empty database opens the first-administrator onboarding screen.

## Before opening a pull request

Run the checks relevant to the files you changed:

```bash
npm run lint
npm run build
composer phpstan
```

Also verify the affected behavior manually. Do not hide warnings or bypass checks to make a pull request pass.

Your pull request description should state:

- The problem being solved
- The chosen approach
- How the change was verified
- Any known limitation or follow-up work

## Licensing

Most files use the [Puppetflow Source Available License](../LICENSE.md). Files under `proprietary/`, files containing the `.pp.` marker, and explicitly marked code blocks use the [Puppetflow Proprietary License](../LICENSE_PROPRIETARY.md).

## Contributor License Agreement

So that we do not have any potential problems later, it is necessary to sign a [Contributor License Agreement](../CONTRIBUTOR_LICENSE_AGREEMENT.md). It can be done literally with the push of a button.

We use the most simple CLA that exists, from [Indie Open Source](https://indieopensource.com/forms/cla), which is written in plain English and is only a few lines long.

Once a pull request is opened, an automated bot will promptly leave a comment requesting the agreement to be signed. The pull request can only be merged once the signature is obtained.
