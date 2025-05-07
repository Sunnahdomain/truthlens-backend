import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../auth";

async function addAdminUser() {
  try {
    const adminUsername = "sunnah_keeper";
    
    // Check if this admin already exists
    const existingUser = await db.select().from(users).where(eq(users.username, adminUsername));
    
    if (existingUser.length > 0) {
      console.log(`Admin user ${adminUsername} already exists. Updating password...`);
      
      // Update the password
      await db.update(users)
        .set({
          password: await hashPassword("ShafiPass@99"),
          role: "admin"
        })
        .where(eq(users.username, adminUsername));
      
      console.log(`Admin user ${adminUsername} password updated successfully.`);
    } else {
      // Create new admin user
      const [newUser] = await db.insert(users)
        .values({
          username: adminUsername,
          password: await hashPassword("ShafiPass@99"),
          email: "admin@truthlens.com",
          name: "Sunnah Keeper",
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      console.log(`Admin user ${adminUsername} created successfully with ID: ${newUser.id}`);
    }
    
    console.log("Done!");
  } catch (error) {
    console.error("Error adding admin user:", error);
  } finally {
    process.exit(0);
  }
}

addAdminUser();