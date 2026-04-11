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

- sizes: `font/size/{3XL,2XL,XL,L,M,S,XS,2XS,3XS}`
- line height: `line/height/{18,20,24,26,28,30,34,38,42,74}`
- letter spacing: `font/spacing/{tight,normal,loose}`

## Extracted primitive values

| Token | Value |
|---|---|
| `font/size/3XL` | `64` |
| `font/size/2XL` | `32` |
| `font/size/XL` | `28` |
| `font/size/L` | `24` |
| `font/size/M` | `20` |
| `font/size/S` | `16` |
| `font/size/XS` | `14` |
| `font/size/2XS` | `12` |
| `font/size/3XS` | `10` |
| `font/spacing/tight` | `-0.8` |
| `font/spacing/normal` | `-0.4` |
| `font/spacing/loose` | `-0.2` |

## Usage rules

- UI controls use `font-family-ui`.
- Editorial headings and high-emphasis display text can use `font-family-editorial`.
- Use tokenized line-height/spacing combinations; avoid ad-hoc values in components.
