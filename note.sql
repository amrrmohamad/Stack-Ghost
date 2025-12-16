-- عشان حضرتك غبي ومرضتش ترفع الداتا بيز اونلاين يبقي اعمل ده


-- run this query in your database

INSERT INTO "Roles" (role_id, role_name) VALUES
  (1, 'admin'),
  (2, 'moderator'),
  (3, 'user')
ON CONFLICT (role_id) DO NOTHING;


INSERT INTO "Users" (
    username,
    email,
    password_hash,
    is_active,
    role_id,
    reputation,
    created_at
) VALUES (
    'Am#######',  -- your name
    'am##########@gmail.com',  -- your email
    '$################################################',  -- you should enter hashed pass
    -- use file hash.js to hash your password
    -- and don't forget to remove your password before upload it to github :(
    true, -- is_active
    1,    -- role_id (admin)
    1000, -- reputation (optional, set as you wish)
    NOW() -- created_at
);

-- adding permission to permission table

INSERT INTO "Permissions" (permission_name) VALUES ('manage_users') ON CONFLICT DO NOTHING;
SELECT permission_id FROM "Permissions" WHERE permission_name = 'manage_users';
-- remove <manage_users_permission_id> and add id of manage_user = 1
INSERT INTO "Role_Permissions" (role_id, permission_id) VALUES (1,1) ON CONFLICT DO NOTHING;
-- Add permission to Permissions table (close question)
INSERT INTO "Permissions" (permission_name) VALUES ('close_questions') ON CONFLICT DO NOTHING;

-- Get the permission_id for 'close_questions'
SELECT permission_id FROM "Permissions" WHERE permission_name = 'close_questions';

-- Suppose the permission_id is 1 and admin role_id is 1, moderator role_id is 2
-- Link permission to admin and moderator roles
INSERT INTO "Role_Permissions" (role_id, permission_id) VALUES (1, 1), (2, 1) ON CONFLICT DO NOTHING;


INSERT INTO "Tags" (tag_name) VALUES
  ('javascript'),
  ('nodejs'),
  ('express'),
  ('prisma'),
  ('postgresql'),
  ('backend'),
  ('api'),
  ('authentication'),
  ('authorization'),
  ('restful')
ON CONFLICT (tag_name) DO NOTHING;