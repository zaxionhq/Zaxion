# Database Querying Guide: Inspecting Users and Roles

This guide explains how to query the database to inspect user records, including their roles and repository permissions.

## Using the Helper Script

We have created a helper script `scripts/check-user-kaandizz.js` (you can copy/rename it) to easily fetch user details.

### Usage

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Run the script:**
    ```bash
    node scripts/check-user-kaandizz.js
    ```

### Customizing the Query

To query for a different user, you can modify the script or create a new one. Here is the template:

```javascript
// scripts/check-user.js
import { initDb } from '../src/models/index.js';

const USERNAME_TO_CHECK = 'YourTargetUsername'; // <--- CHANGE THIS

async function checkUser() {
  try {
    const db = await initDb();
    
    const user = await db.User.findOne({
      where: { username: USERNAME_TO_CHECK },
      include: [
        { 
          model: db.RepositoryMaintainerMapping, 
          as: 'repositoryMappings', 
          required: false,
          include: [{ model: db.Repository, as: 'repository' }]
        }
      ]
    });

    if (!user) {
      console.log(`User "${USERNAME_TO_CHECK}" not found.`);
      return;
    }

    console.log('--- User Details ---');
    console.log(`ID: ${user.id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Role: ${user.role}`);
    console.log(`Email: ${user.email}`);
    console.log(`Created At: ${user.createdAt}`);

    if (user.repositoryMappings && user.repositoryMappings.length > 0) {
      console.log('\n--- Repository Permissions ---');
      user.repositoryMappings.forEach(mapping => {
        console.log(`- ${mapping.repository.name}: ${mapping.githubPermissionLevel}`);
      });
    } else {
      console.log('\nNo specific repository permissions found.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkUser();
```

## SQL Equivalent

If you prefer direct SQL access (via `psql` or a database client), use the following query:

```sql
SELECT 
    u.id AS user_id,
    u.username,
    u.email,
    u."role",
    u.created_at,
    u.updated_at,
    r.name AS repo_name,
    rm.github_permission_level
FROM 
    users u
LEFT JOIN 
    repository_maintainer_mappings rm ON u.id = rm.user_id
LEFT JOIN 
    repositories r ON rm.repository_id = r.id
WHERE 
    u.username = 'Kaandizz'; -- Replace with target username
```
