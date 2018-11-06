import path from 'path';
import test from 'asia';
import fs from 'fs-extra';
import update from '../src';

import { __dirname } from './cjs';

const pkgJson = {
  name: 'charlike',
  license: 'Apache-2.0',
  licenseStart: '1999',
  scripts: {
    bar: 'echo bar',
  },
  dependencies: {
    baaaaaaaaaaaaaaaaar: '1.1.11111',
  },
  devDependencies: {
    quuuuuuuuuuuuuxxxx: '2.2.22222',
  },
};

test('basic test', async (t) => {
  const join = (...args) => path.join(__dirname, 'fixtures', ...args);
  const name = 'charlike';

  await fs.remove(join(name));

  await fs.mkdirp(join(name, 'src'));

  const content = 'export default () => 123;\n';
  await fs.writeFile(join(name, 'src', 'index.js'), content);
  await fs.writeJSON(join(name, 'package.json'), pkgJson);

  await update(name, { cwd: join() });

  const newPkg = await fs.readJSON(join(name, 'package.json'));

  t.strictEqual(newPkg.name, name);
  t.strictEqual(newPkg.license, 'Apache-2.0');
  t.strictEqual(newPkg.licenseStart, '2016');

  t.ok(newPkg.dependencies.esm);
  t.ok(newPkg.devDependencies.asia);
  t.ok(newPkg.devDependencies['@tunnckocore/config']);

  t.strictEqual(newPkg.devDependencies.quuuuuuuuuuuuuxxxx, undefined);
  t.strictEqual(newPkg.scripts.bar, undefined);

  const srcContent = await fs.readFile(join(name, 'src', 'index.js'), 'utf8');
  t.strictEqual(srcContent, content);

  t.ok(newPkg.bin);
  t.ok(newPkg.files);

  t.strictEqual(newPkg.bin, 'cli.js');
  t.ok(newPkg.files.includes('templates'));
  t.ok(newPkg.files.includes('cli.js'));
});
