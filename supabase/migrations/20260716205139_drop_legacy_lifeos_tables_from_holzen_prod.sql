-- History shim: holzen-prod recorded this version via dashboard/MCP
-- (name: drop_legacy_lifeos_tables_from_holzen_prod). lifeos_issues / lifeos_runs
-- are gone on prod. Later *lifeos* files in this folder no-op when those tables
-- are missing. See LIFEOS-LEGACY.md.

select 1;
