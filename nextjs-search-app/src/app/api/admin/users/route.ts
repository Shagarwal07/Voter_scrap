import { NextResponse } from 'next/server';
import { getAuthDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/authOptions";
import { getElectionDbPath, openReadonlyDb } from '@/utils/dbPath';
import { checkSuperUser } from '@/utils/auth';
import fs from 'fs';

// Force dynamic execution for admin endpoints
export const dynamic = 'force-dynamic';

const VALID_ROLES = ['developer', 'admin', 'user'];
const VALID_TIERS = ['free', 'paid'];

/**
 * Strict role verification allowing developers, admins, and root system emails.
 */
async function getAdminSession() {
  const session: any = await getServerSession(authOptions);
  const authStatus = checkSuperUser(session?.user);
  return { 
    isAuthorized: authStatus.isSuperUser, 
    isDeveloper: authStatus.isDeveloper,
    isAdmin: authStatus.isAdmin,
    session 
  };
}

// GET all auth users or dynamic dropdown metadata
export async function GET(request: Request) {
  try {
    const { isAuthorized } = await getAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Dynamic metadata for dropdowns (no hardcoded values)
    if (searchParams.get('meta') === 'true') {
      const wardSet = new Set<number>();
      const galiSet = new Set<string>();
      const groupedGalis: Record<string, string[]> = {};

      // 1. Query Nagar Parishad Wards and Structured Galis by Block
      try {
        const npVotersPath = getElectionDbPath('nagar_parishad', 'voters');
        if (fs.existsSync(npVotersPath)) {
          const npVotersDb = await openReadonlyDb(npVotersPath);
          const npWards = await npVotersDb.all<{ ward: number }[]>(
            'SELECT DISTINCT ward FROM voters WHERE ward IS NOT NULL ORDER BY ward ASC'
          );
          await npVotersDb.close();
          npWards.forEach(r => wardSet.add(r.ward));
        }

        const npHousesPath = getElectionDbPath('nagar_parishad', 'houses');
        if (fs.existsSync(npHousesPath)) {
          const npHouseDb = await openReadonlyDb(npHousesPath);
          const npRows = await npHouseDb.all<{ block: string; gali: string }[]>(
            `SELECT DISTINCT block, gali FROM houses 
             WHERE block IS NOT NULL AND TRIM(block) != ''
             ORDER BY block ASC, gali ASC`
          );
          await npHouseDb.close();

          for (const r of npRows) {
            const b = r.block.trim();
            const g = r.gali ? r.gali.trim() : '';
            if (!groupedGalis[b]) groupedGalis[b] = [];

            if (g && g !== b && !g.toLowerCase().startsWith('house') && g !== 'Unspecified Category') {
              const fullLabel = `${b} - ${g}`;
              if (!groupedGalis[b].includes(fullLabel)) {
                groupedGalis[b].push(fullLabel);
              }
              galiSet.add(fullLabel);
            } else if (!groupedGalis[b].includes(b)) {
              groupedGalis[b].push(b);
              galiSet.add(b);
            }
          }
        }
      } catch (npErr) {
        console.warn('Admin meta NP read error:', npErr);
      }

      // 2. Query Vidhan Sabha Polling Station Parts & Slips
      try {
        const vsVotersPath = getElectionDbPath('vidhan_sabha', 'voters');
        if (fs.existsSync(vsVotersPath)) {
          const vsVotersDb = await openReadonlyDb(vsVotersPath);
          const vsParts = await vsVotersDb.all<{ part_no: number }[]>(
            'SELECT DISTINCT part_no FROM voters WHERE part_no IS NOT NULL ORDER BY part_no ASC'
          );
          await vsVotersDb.close();
          vsParts.forEach(r => wardSet.add(r.part_no));
        }

        const vsHousesPath = getElectionDbPath('vidhan_sabha', 'houses');
        if (fs.existsSync(vsHousesPath)) {
          const vsHouseDb = await openReadonlyDb(vsHousesPath);
          const vsSlips = await vsHouseDb.all<{ part_no: number; slip_label: string }[]>(
            `SELECT DISTINCT part_no, slip_label 
             FROM houses 
             WHERE slip_label IS NOT NULL AND TRIM(slip_label) != ''
             ORDER BY part_no ASC, slip_id ASC`
          );
          await vsHouseDb.close();

          for (const r of vsSlips) {
            if (r.slip_label && r.slip_label.trim()) {
              const groupKey = `Legislative Assembly (Part ${r.part_no})`;
              if (!groupedGalis[groupKey]) groupedGalis[groupKey] = [];
              const label = `Part ${r.part_no} - ${r.slip_label.trim()}`;
              if (!groupedGalis[groupKey].includes(label)) {
                groupedGalis[groupKey].push(label);
              }
              galiSet.add(label);
            }
          }
        }
      } catch (vsErr) {
        console.warn('Admin meta VS read error:', vsErr);
      }

      const sortedWards = Array.from(wardSet).sort((a, b) => a - b);
      
      // Natural alphanumeric sort for Galis (e.g. Gali No. 1, 2, 3... 10)
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      const sortedGalis = Array.from(galiSet).sort((a, b) => collator.compare(a, b));

      return NextResponse.json({
        success: true,
        wards: sortedWards,
        galis: sortedGalis,
        groupedGalis,
      });
    }

    const db = await getAuthDb();
    
    // Read from users table with complete unified schema
    const users = await db.all(`
      SELECT id, name, email, image, role, subscription_tier, allowed_wards, allowed_galis, created_at 
      FROM users 
      ORDER BY id DESC
    `);
    
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Auth DB read error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE an existing auth user
export async function PUT(request: Request) {
  try {
    const { isAuthorized, isDeveloper } = await getAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, email, role, subscription_tier, allowed_wards, allowed_galis } = body;

    const numId = parseInt(String(id), 10);
    if (isNaN(numId) || !email) {
      return NextResponse.json({ error: "Valid User ID and Email are required." }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanRole = VALID_ROLES.includes(role) ? role : 'user';
    const cleanTier = VALID_TIERS.includes(subscription_tier) ? subscription_tier : 'free';
    const cleanName = String(name || '').trim();
    const cleanWards = String(allowed_wards || '').trim();
    const cleanGalis = String(allowed_galis || '').trim();

    const db = await getAuthDb();

    // Guard: Verify target user exists and prevent unauthorized privilege escalation
    const targetUser = await db.get("SELECT id, email, role FROM users WHERE id = ?", [numId]);
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }

    const targetIsDev = targetUser.role === 'developer' || checkSuperUser(targetUser).isDeveloper;
    if ((cleanRole === 'developer' || targetIsDev) && !isDeveloper) {
      return NextResponse.json({ 
        error: "Forbidden: Only developers can modify developer accounts or grant developer privileges." 
      }, { status: 403 });
    }

    await db.run(`
      UPDATE users 
      SET name = ?, email = ?, role = ?, subscription_tier = ?, allowed_wards = ?, allowed_galis = ?
      WHERE id = ?
    `, [cleanName, cleanEmail, cleanRole, cleanTier, cleanWards, cleanGalis, numId]);

    return NextResponse.json({ 
      success: true, 
      message: "User updated successfully." 
    });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// CREATE a new auth user
export async function POST(request: Request) {
  try {
    const { isAuthorized, isDeveloper } = await getAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role, subscription_tier, allowed_wards, allowed_galis } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanRole = VALID_ROLES.includes(role) ? role : 'user';
    const cleanTier = VALID_TIERS.includes(subscription_tier) ? subscription_tier : 'free';
    const cleanName = String(name || '').trim();
    const cleanWards = String(allowed_wards || '').trim();
    const cleanGalis = String(allowed_galis || '').trim();

    // Guard: Only developers can create developer accounts
    if (cleanRole === 'developer' && !isDeveloper) {
      return NextResponse.json({ 
        error: "Forbidden: Only developers can create developer accounts." 
      }, { status: 403 });
    }

    const db = await getAuthDb();
    
    // Check if user already exists
    const existing = await db.get("SELECT id FROM users WHERE LOWER(email) = ?", [cleanEmail]);
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
    }

    const result = await db.run(`
      INSERT INTO users (name, email, role, subscription_tier, allowed_wards, allowed_galis)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [cleanName, cleanEmail, cleanRole, cleanTier, cleanWards, cleanGalis]);

    return NextResponse.json({ 
      success: true, 
      id: result.lastID,
      message: "User created successfully." 
    });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE an auth user
export async function DELETE(req: Request) {
  try {
    const { isAuthorized, isDeveloper, session } = await getAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get('id');
    const numId = rawId ? parseInt(rawId, 10) : NaN;

    if (isNaN(numId)) {
      return NextResponse.json({ error: "Valid numeric User ID is required." }, { status: 400 });
    }

    const db = await getAuthDb();

    // 1. Fetch user to verify before deletion
    const targetUser = await db.get("SELECT id, email, role FROM users WHERE id = ?", [numId]);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const currentUserEmail = (session?.user?.email || '').trim().toLowerCase();
    const targetEmail = (targetUser.email || '').trim().toLowerCase();
    const developerEmail = (process.env.DEVELOPER_EMAIL || '').trim().toLowerCase();
    const rootAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

    // 2. Prevent self-deletion
    if (currentUserEmail && targetEmail === currentUserEmail) {
      return NextResponse.json({ error: "Cannot delete your own active account." }, { status: 400 });
    }

    // 3. Prevent deletion of developer or root admin
    if (developerEmail && targetEmail === developerEmail) {
      return NextResponse.json({ error: "Cannot delete the lead system developer." }, { status: 400 });
    }
    if (rootAdminEmail && targetEmail === rootAdminEmail) {
      return NextResponse.json({ error: "Cannot delete the primary root system administrator." }, { status: 400 });
    }
    if ((targetUser.role === 'developer' || checkSuperUser(targetUser).isDeveloper) && !isDeveloper) {
      return NextResponse.json({ error: "Forbidden: Only developers can delete developer accounts." }, { status: 403 });
    }

    // 4. Safe to execute deletion
    await db.run("DELETE FROM users WHERE id = ?", [numId]);

    return NextResponse.json({ 
      success: true, 
      message: "User deleted successfully." 
    });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
