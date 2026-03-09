// scripts/check-user-kaandizz.js
import { initDb } from '../src/models/index.js';

async function checkUser() {
  try {
    // Initialize Database
    const db = await initDb();
    
    // Find the user "Kaandizz"
    // Note: We use case-insensitive search if needed, but assuming exact match or username field
    const user = await db.User.findOne({
      where: { username: 'Kaandizz' },
      // Include any associations if needed (e.g. TestCases, RefreshTokens)
      // Since roles are an ENUM column on the user table itself in our schema, we don't need a JOIN.
      // But if we had a Repository mapping, we could include it.
      include: [
        { 
          model: db.RepositoryMaintainerMapping, 
          as: 'repositoryMappings', // Correct association name from User model
          required: false 
        }
      ]
    });

    if (!user) {
      console.log('User "Kaandizz" not found.');
    } else {
      console.log('--- User Record ---');
      console.log(JSON.stringify(user.toJSON(), null, 2));
      
      console.log('\n--- Role Information ---');
      console.log(`Assigned Role: ${user.role}`);
      
      if (user.role === 'maintainer') {
        console.log('User is a Maintainer. Checking repository permissions...');
        // If we had included mappings, they would be here.
        // Let's explicitly fetch them if the include above didn't work as expected or just to be sure
        const mappings = await db.RepositoryMaintainerMapping.findAll({
            where: { userId: user.id },
            include: [{ model: db.Repository, as: 'repository' }]
        });
        
        if (mappings.length > 0) {
            console.log(`User has maintainer access to ${mappings.length} repositories:`);
            mappings.forEach(m => {
                console.log(`- Repo: ${m.repository.name} (${m.repository.owner}/${m.repository.name}) | Permission: ${m.githubPermissionLevel}`);
            });
        } else {
            console.log('User is a maintainer but has no repository mappings found (Sync might be needed).');
        }
      } else if (user.role === 'admin') {
          console.log('User is an Admin (System-wide access).');
      } else {
          console.log('User is a standard User (Read-only).');
      }
    }

  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    process.exit();
  }
}

checkUser();
