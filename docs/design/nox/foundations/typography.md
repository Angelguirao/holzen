---
title: Nox Typography Tokens
figma_file_key: c6vKLjDHRKfpluorJlT90n
figma_node_id: 4:4832
nox_version: 1.0.0
status: draft
---

# Typography

## Families

- `font-family-editorial`: `Newsreader`
- `font-family-ui`: `Inter`

## Styles and weights

- styles: `font-style-normal`, `font-style-italic`
- weights: `font-weight-light (300)`, `font-weight-regular (400)`, `font-weight-medium (500)`

## Size and rhythm

- sizes: `font/size/{S,M,L,XL}`
- line height: `line/height/{18,20,24,26,28,30,34,38,42,74}`
- letter spacing: `font/spacing/{tight,normal,loose}`

## Usage rules

- UI controls use `font-family-ui`.
- Editorial headings and high-emphasis display text can use `font-family-editorial`.
- Use tokenized line-height/spacing combinations; avoid ad-hoc values in components.
