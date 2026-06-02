alter table store_settings
add column if not exists required_tasks_to_claim int default 2;
