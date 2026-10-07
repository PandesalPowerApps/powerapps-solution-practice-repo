# Solution exports and app security

Store local solution ZIP snapshots in `exports/` (ignored by Git).
`SimpleCodeApp_1_0_0_2.zip` contains Admin, Location Manager, and Product Manager.
All three read Products, Locations, and Product Location Joins at Global scope.
Admin has all eight table privileges on all three; each manager has all eight
on their own table and only Read on the other two.

The app does not load the ZIP or grant access by role name. At runtime it calls
WhoAmI and RetrieveUserPrivileges through generated Power Apps services, then
matches granted privilege IDs against each table's Privileges metadata.
The shared policy in src/security/permissions.ts gates UI actions and handlers.
Relationship saves also require Append on the join and Append To on both parents.
Refreshing data reloads privileges. Permission lookup failures disable access.
Dataverse remains responsible for record-level access and enforcing all requests;
table privilege presence alone does not guarantee access to a particular record.

Verification: `node --test tests/permissions.test.ts`, `npm run build`,
and `npm run lint`. Before release, test in the Power Apps host as each role and
as a user with combined roles, including denied saves and permission refresh.
Local CLI authentication is for development and does not identify app users.
