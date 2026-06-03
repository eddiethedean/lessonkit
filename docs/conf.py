"""Sphinx configuration for LessonKit on Read the Docs."""

from __future__ import annotations

from datetime import datetime

project = "LessonKit"
copyright = f"{datetime.now().year}, LessonKit contributors"
author = "LessonKit contributors"
release = "1.1.0"

extensions = [
    "myst_parser",
    "sphinx_copybutton",
    "sphinx_design",
]

templates_path = ["_templates"]
# Markdown included via reference/* and project/* wrappers — not standalone Sphinx pages.
exclude_patterns = [
    "_build",
    ".venv",
    "site",
    "storybook",
    "Thumbs.db",
    ".DS_Store",
    "README.md",
    "READTHEDOCS.md",
    "CLI.md",
    "PACKAGING.md",
    "IDENTITY.md",
    "TELEMETRY.md",
    "THEMING.md",
    "ACCESSIBILITY.md",
    "BLOCK_CATALOG.md",
    "CORE.md",
    "PLUGINS.md",
    "LXPACK_BRIDGE.md",
    "LXPACK_UPGRADES_FOR_LESSONKIT.md",
    "LXPACK_UPGRADE_PLAN_FOR_MAINTAINERS.md",
    "LessonKit_Studio_PLAN.md",
    "LessonKit_Studio_SPEC.md",
    "STUDIO_READINESS.md",
]

source_suffix = {
    ".md": "markdown",
}

root_doc = "index"

html_theme = "furo"
html_static_path = ["_static"]
html_css_files = ["custom.css"]
html_favicon = "_static/favicon.svg"
html_title = "LessonKit"
html_logo = "_static/logo.svg"

html_theme_options = {
    "source_repository": "https://github.com/eddiethedean/lessonkit/",
    "source_branch": "main",
    "source_directory": "docs/",
    "light_css_variables": {
        "color-brand-primary": "#2563eb",
        "color-brand-content": "#1e40af",
        "color-brand-visited": "#7c3aed",
        "color-background-primary": "#fafbfc",
        "color-background-secondary": "#f1f5f9",
        "color-background-hover": "#e2e8f0",
        "color-background-border": "#e2e8f0",
        "color-foreground-primary": "#0f172a",
        "color-foreground-secondary": "#475569",
        "color-foreground-muted": "#64748b",
        "color-foreground-border": "#cbd5e1",
        "color-api-background": "#f8fafc",
        "color-api-background-hover": "#f1f5f9",
        "color-api-overall": "#e0e7ff",
        "color-api-keyword": "#2563eb",
        "color-api-name": "#0f172a",
        "color-api-pre-name": "#64748b",
        "font-stack": "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        "font-stack--monospace": "ui-monospace, 'SF Mono', 'Cascadia Code', 'Segoe UI Mono', Menlo, Consolas, monospace",
    },
    "dark_css_variables": {
        "color-brand-primary": "#60a5fa",
        "color-brand-content": "#93c5fd",
        "color-brand-visited": "#c4b5fd",
        "color-background-primary": "#0b1120",
        "color-background-secondary": "#111827",
        "color-background-hover": "#1e293b",
        "color-background-border": "#334155",
        "color-foreground-primary": "#f1f5f9",
        "color-foreground-secondary": "#94a3b8",
        "color-foreground-muted": "#64748b",
        "color-foreground-border": "#475569",
        "color-api-background": "#0f172a",
        "color-api-background-hover": "#1e293b",
        "color-api-overall": "#1e3a5f",
        "color-api-keyword": "#60a5fa",
        "color-api-name": "#f8fafc",
        "color-api-pre-name": "#94a3b8",
    },
    "sidebar_hide_name": True,
    "top_of_page_buttons": ["view", "edit"],
    "footer_icons": [
        {
            "name": "GitHub",
            "url": "https://github.com/eddiethedean/lessonkit",
            "html": '<span aria-hidden="true">◆</span> GitHub',
            "class": "",
        },
        {
            "name": "npm",
            "url": "https://www.npmjs.com/org/lessonkit",
            "html": '<span class="lk-footer-npm">npm</span>',
            "class": "",
        },
    ],
}

pygments_style = "sphinx"
pygments_dark_style = "monokai"

myst_enable_extensions = [
    "colon_fence",
    "deflist",
    "tasklist",
]
myst_heading_anchors = 4
myst_url_schemes = ("http", "https", "mailto")

copybutton_prompt_text = r">>> |\.\.\. |\$ |bash# "
copybutton_prompt_is_regexp = True
