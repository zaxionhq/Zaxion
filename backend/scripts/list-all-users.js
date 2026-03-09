// scripts/list-all-users.js
import { initDb } from '../src/models/index.js';

async function listAllUsers() {
  try {
    // Initialize Database
    const db = await initDb();
    
    // Fetch all users with their repository mappings
    const users = await db.User.findAll({
      include: [
        { 
          model: db.RepositoryMaintainerMapping, 
          as: 'repositoryMappings', 
          required: false,
          include: [{ model: db.Repository, as: 'repository' }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`\n--- Found ${users.length} Users ---\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. [${user.role.toUpperCase()}] ${user.username} (${user.email || 'No Email'})`);
      console.log(`   ID: ${user.id}`);
      
      if (user.repositoryMappings && user.repositoryMappings.length > 0) {
        console.log(`   Repositories:`);
        user.repositoryMappings.forEach(mapping => {
          console.log(`     - ${mapping.repository.name} (${mapping.githubPermissionLevel})`);
        });
      } else {
        console.log(`   Repositories: None`);
      }
      console.log(''); // Empty line for readability
    });

  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    process.exit();
  }
}

listAllUsers();
