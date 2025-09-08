-- Insert Company Data
INSERT INTO mst_company (company_id, company_name)
VALUES ('bc90d453-0c64-4f6f-8bbe-dca32aba40d1', 'SKM Steels')
ON CONFLICT (company_id) DO UPDATE SET company_name = EXCLUDED.company_name;

-- Insert Division Data
INSERT INTO mst_division (division_id, company_id, division_name, tally_url)
VALUES ('b38bfb72-3dd7-4aa5-b970-71b919d5ded4', 'bc90d453-0c64-4f6f-8bbe-dca32aba40d1', 'SKM Steels (Chennai)', 'https://0780aee7142f.ngrok-free.app')
ON CONFLICT (division_id) DO UPDATE SET company_id = EXCLUDED.company_id, division_name = EXCLUDED.division_name, tally_url = EXCLUDED.tally_url;
