#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function parseArgs(argv) {
  const out = {
    model: '@cf/black-forest-labs/flux-2-dev',
    width: 1024,
    height: 1024,
    steps: 25,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--prompt') out.prompt = argv[++i];
    else if (arg === '--output') out.output = argv[++i];
    else if (arg === '--model') out.model = argv[++i];
    else if (arg === '--width') out.width = Number(argv[++i]);
    else if (arg === '--height') out.height = Number(argv[++i]);
    else if (arg === '--steps') out.steps = Number(argv[++i]);
    else if (arg === '--account-id') out.accountId = argv[++i];
    else if (arg === '--token') out.token = argv[++i];
    else if (arg === '--help' || arg === '-h') out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return out;
}

function help() {
  console.log(`Usage:
  node scripts/generate-cloudflare-image.mjs --prompt "..." --output path/to/image.jpg

Options:
  --prompt       Prompt text for the image model (required)
  --output       Output file path (required)
  --model        Cloudflare model name (default: @cf/black-forest-labs/flux-2-dev)
  --width        Image width (default: 1024)
  --height       Image height (default: 1024)
  --steps        Sampling steps (default: 25)
  --account-id   Cloudflare account ID (optional; autodetected from wrangler)
  --token        Cloudflare OAuth token (optional; autodetected from wrangler)
`);
}

function readWranglerAuth() {
  const configPath = resolve(process.env.HOME || '', '.config/.wrangler/config/default.toml');
  if (!existsSync(configPath)) return {};

  const text = readFileSync(configPath, 'utf8');
  const tokenMatch = text.match(/^oauth_token = "([^"]+)"$/m);
  return tokenMatch ? { token: tokenMatch[1] } : {};
}

function readWranglerAccountId() {
  try {
    const out = execFileSync('npx', ['-y', 'wrangler', 'whoami'], { encoding: 'utf8' });
    const match = out.match(/Account ID\s+│\s+([a-f0-9]{32})/i);
    if (match) return match[1];
  } catch {
    // Fall through to env-based discovery.
  }
  return process.env.CF_ACCOUNT_ID || '';
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    help();
    return;
  }

  if (!args.prompt) throw new Error('--prompt is required');
  if (!args.output) throw new Error('--output is required');

  const auth = readWranglerAuth();
  const token = args.token || process.env.CF_API_TOKEN || auth.token;
  const accountId = args.accountId || readWranglerAccountId();

  if (!token) throw new Error('No Cloudflare token found. Pass --token or login with wrangler.');
  if (!accountId) throw new Error('No Cloudflare account ID found. Pass --account-id or run wrangler whoami.');

  const form = new FormData();
  form.set('prompt', args.prompt);
  form.set('width', String(args.width));
  form.set('height', String(args.height));
  form.set('steps', String(args.steps));

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${args.model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Cloudflare AI request failed (${res.status}): ${text}`);
  }

  const json = JSON.parse(text);
  const image = json?.result?.image;
  if (!image) {
    throw new Error(`No image returned: ${text}`);
  }

  writeFileSync(args.output, Buffer.from(image, 'base64'));
  process.stdout.write(`${args.output}\n`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
