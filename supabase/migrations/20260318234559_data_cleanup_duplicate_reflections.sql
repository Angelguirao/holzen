
-- Clean up duplicate reflections from 2026-03-18 23:38:10 burst (keep latest only)
DELETE FROM library_items WHERE reflection_id IN (
  'd374d5c3-a835-43dd-8305-4f15c77d3e34',
  'dcc785f7-54c6-450c-b1e8-fe9021746cc9',
  'f4ce9890-4ee9-48e2-bbd9-260379991a96',
  'f16b2f42-8a7f-44d8-bc65-ace2584cca6b'
);
DELETE FROM reflections WHERE id IN (
  'd374d5c3-a835-43dd-8305-4f15c77d3e34',
  'dcc785f7-54c6-450c-b1e8-fe9021746cc9',
  'f4ce9890-4ee9-48e2-bbd9-260379991a96',
  'f16b2f42-8a7f-44d8-bc65-ace2584cca6b'
);

-- Also clean up the 18:34:57-58 pair (keep latest)
DELETE FROM library_items WHERE reflection_id = 'bf4d25c3-1caf-4825-91f7-008c6b3792fc';
DELETE FROM reflections WHERE id = 'bf4d25c3-1caf-4825-91f7-008c6b3792fc';
