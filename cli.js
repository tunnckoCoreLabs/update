#!/usr/bin/env node

'use strict';

const path = require('path');
const proc = require('process');
const charlike = require('charlike');
// const { exec } = require('@tunnckocore/execa');
const getPkg = require('@tunnckocore/package-json').default;
const fs = require('fs-extra');

const get = async (name, field) => (await getPkg(name))[field];

const cwd = proc.cwd();
const name = path.basename(cwd);
const upDir = path.dirname(cwd);

// eslint-disable-next-line import/no-dynamic-require
const pkg = require(path.join(cwd, 'package.json'));

async function main() {
  proc.chdir(upDir);

  const oldCwd = path.join(upDir, `old-${name}`);
  if (await fs.pathExists(oldCwd)) {
    await fs.remove(oldCwd);
  } else {
    await fs.move(cwd, oldCwd);
  }

  const deps = JSON.stringify(
    Object.assign({}, pkg.dependencies, {
      esm: `^${await get('esm', 'version')}`,
    }),
  );

  const devDeps = JSON.stringify(
    Object.assign({}, pkg.devDependencies, {
      '@tunnckocore/config': `^${await get('@tunnckocore/config', 'version')}`,
      '@tunnckocore/scripts': `^${await get(
        '@tunnckocore/scripts',
        'version',
      )}`,
      asia: `^${await get('asia', 'version')}`,
    }),
  );

  await charlike(pkg.name, pkg.description, {
    cwd: upDir,
    owner: 'tunnckoCoreLabs',
    licenseStart: pkg.licenseStart,
    locals: {
      deps,
      devDeps,
    },
  });

  await fs.move(path.join(oldCwd, 'src'), path.join(cwd, 'src'), {
    overwrite: true,
  });
  await fs.move(path.join(oldCwd, 'test'), path.join(cwd, 'test'), {
    overwrite: true,
  });
  await fs.move(path.join(oldCwd, '.git'), path.join(cwd, '.git'), {
    overwrite: true,
  });

  console.log('Make sure to `cd` again to', cwd);
}

main().catch((err) => {
  console.log(err.stack);
  proc.exit(1);
});
