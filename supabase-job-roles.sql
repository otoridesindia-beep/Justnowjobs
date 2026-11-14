-- Hyrnex: migrate job roles to the new role list. Run once in Supabase SQL Editor on an existing database.
alter table public.jobs drop constraint if exists jobs_role_check;
update public.jobs set role = case role
  when 'Analytics' then 'Data Analyst'
  when 'Engineering' then 'Data Engineer'
  when 'Science' then 'Data Scientist'
  when 'Product' then 'Data Analyst'
  else role end;
alter table public.jobs add constraint jobs_role_check check (role in ('Data Analyst', 'Power BI Developer', 'SQL Developer', 'Data Engineer', 'Azure Data Engineer', 'Tableau Developer', 'BI Developer', 'Informatica Developer', 'ETL Developer', 'Snowflake Developer', 'Databricks Developer', 'Python Data Engineer', 'Analytics Engineer', 'Data Scientist', 'Microsoft Fabric Developer', 'Software Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Java Developer', 'Python Developer', '.NET Developer', 'React Developer', 'Node.js Developer', 'Mobile App Developer', 'DevOps Engineer', 'QA / Test Engineer', 'HR Executive', 'Sales Executive', 'Marketing Executive', 'Accountant', 'Customer Support', 'Operations Executive', 'Business Development', 'Admin / Back Office'));