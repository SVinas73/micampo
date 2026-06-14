// Gestión de usuarios de login de MiCampo.
// Requiere: DATABASE_URL en el entorno y `npx prisma generate` ya corrido.
//
// Uso:
//   node scripts/usuario.mjs list
//   node scripts/usuario.mjs set <email> <password> [nombre]
//
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const [cmd, email, password, nombre] = process.argv.slice(2);

async function main() {
  if (cmd === "list") {
    const users = await prisma.user.findMany({ select: { email: true, name: true, createdAt: true } });
    if (users.length === 0) {
      console.log("No hay usuarios en la base. Creá uno con:  node scripts/usuario.mjs set tu@email.com tuPassword");
      return;
    }
    console.log(`\n${users.length} usuario(s):`);
    users.forEach((u) => console.log(`  • ${u.email}   ${u.name ? "(" + u.name + ")" : ""}`));
    console.log("\nPara resetear la contraseña de uno:  node scripts/usuario.mjs set <email> <nuevaPassword>\n");
    return;
  }

  if (cmd === "set") {
    if (!email || !password) {
      console.error("Uso: node scripts/usuario.mjs set <email> <password> [nombre]");
      process.exit(1);
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.upsert({
      where: { email },
      update: { password: hash, ...(nombre ? { name: nombre } : {}) },
      create: { email, password: hash, name: nombre || email.split("@")[0] },
    });
    console.log(`\n✅ Usuario listo: ${user.email}`);
    console.log(`   Contraseña: ${password}`);
    console.log(`   Ya podés iniciar sesión con esas credenciales.\n`);
    return;
  }

  console.log("Comandos:\n  node scripts/usuario.mjs list\n  node scripts/usuario.mjs set <email> <password> [nombre]");
}

main()
  .catch((e) => { console.error("Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
