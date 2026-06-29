### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `bin/devlog.js`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@helix_dev/devlog",
  "version": "0.1.0",
  "description": "A structured daily coding journal CLI",
  "bin": {
    "devlog": "bin/devlog.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "keywords": ["journal", "devlog", "cli"],
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^2.0.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
dist/
```

- [ ] **Step 4: Create `bin/devlog.js`**

```javascript
#!/usr/bin/env node
require('../dist/cli.js');
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`

Expected: node_modules/ created, package-lock.json created

- [ ] **Step 6: Build and verify**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold project"
```
