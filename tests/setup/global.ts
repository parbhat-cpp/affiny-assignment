import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

export async function setup() {
    execSync('docker compose -f docker-compose.test.yaml up -d --wait', {
        stdio: 'inherit'
    });

    execSync('rm -rf drizzle', {
        stdio: 'inherit'
    });

    execSync('npx drizzle-kit migrate', {
        stdio: 'inherit',
        env: {
            ...process.env,
            DATABASE_URL: process.env.DATABASE_URL,
        }
    });
}

export async function teardown() {
    execSync('docker compose -f docker-compose.test.yaml down', {
        stdio: 'inherit'
    });
}