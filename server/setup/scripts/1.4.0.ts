import Database from "better-sqlite3";
import path from "path";
import { APP_PATH } from "@server/lib/consts";

const version = "1.4.0";
const location = path.join(APP_PATH, "db", "db.sqlite");

export default async function migration() {
    console.log(`Running setup script ${version}...`);

    const db = new Database(location);

    try {
        db.pragma("foreign_keys = OFF");
        db.transaction(() => {
            // Add auth customization fields to resources table
            db.exec(`
                ALTER TABLE 'resources' ADD 'authCustomCSS' text;
                ALTER TABLE 'resources' ADD 'authCustomHTML' text;
                ALTER TABLE 'resources' ADD 'authCustomLogo' text;
                ALTER TABLE 'resources' ADD 'authCustomTitle' text;
                ALTER TABLE 'resources' ADD 'authCustomDescription' text;
                ALTER TABLE 'resources' ADD 'authCustomBackground' text;
                ALTER TABLE 'resources' ADD 'authCustomEnabled' integer DEFAULT 0 NOT NULL;
            `);
        })(); // executes the transaction immediately
        db.pragma("foreign_keys = ON");
        console.log(`Added auth customization fields to resources table`);
    } catch (e) {
        console.log("Unable to add auth customization fields");
        throw e;
    }

    console.log(`${version} migration complete`);
}
