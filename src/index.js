import path from 'path';
import proc from 'process';
import fs from 'fs-extra';
import charlike from 'charlike';
import mixinDeep from 'mixin-deep';
import packageJson from '@tunnckocore/package-json';

const get = async (name, field) => (await packageJson(name))[field];

export default async function update(name, settings) {
  const options = Object.assign({ cwd: proc.cwd() }, settings);
  const projectCwd = name ? path.join(options.cwd, name) : options.cwd;
  const upperDir = name ? options.cwd : path.dirname(projectCwd);

  const projectPkgJsonPath = path.join(projectCwd, 'package.json');

  if (!(await fs.pathExists(projectPkgJsonPath))) {
    throw new Error('Project should have package.json and be published in npm');
  }

  const pkg = await getLatestPkg(projectCwd);

  if (!name) {
    proc.chdir(upperDir);
  }

  const newProjectDir = path.join(upperDir, String(Date.now()));

  await copyToTemp(projectCwd, newProjectDir);
  await fs.remove(projectCwd);

  await runCharlike(pkg, upperDir, options);

  await fs.copy(newProjectDir, projectCwd, { overwrite: true });
  await fs.remove(newProjectDir);

  const projectPkg = await fs.readJSON(path.join(projectCwd, 'package.json'));

  if (pkg.bin) {
    projectPkg.bin = pkg.bin;
  }
  if (pkg.files) {
    projectPkg.files = pkg.files;
  }
  if (projectPkg.verb && pkg.verb) {
    projectPkg.verb.related = pkg.verb.related;
  }

  await fs.writeJSON(path.join(projectCwd, 'package.json'), projectPkg, {
    spaces: 2,
  });

  return { cwd: projectCwd, ranInCwd: !name };
}

async function getLatestPkg(projectCwd) {
  const { default: p } = await import(path.join(projectCwd, 'package.json'));
  let pkg = null;
  try {
    pkg = await packageJson(p.name);
  } catch (err) {
    throw new Error(`Project ${p.name} should exist in npm before updating it`);
  }
  return pkg;
}

// TODO: cleanup / simplify when `charlike` supports `ignore` option
async function copyToTemp(projectCwd, newProjectDir) {
  const join = (x, c) => path.join(c || projectCwd, x);

  await fs.mkdirp(newProjectDir);

  if (await fs.pathExists(join('src'))) {
    await fs.copy(join('src'), join('src', newProjectDir), { overwrite: true });
  }

  if (await fs.pathExists(join('test'))) {
    await fs.copy(join('test'), join('test', newProjectDir), {
      overwrite: true,
    });
  }

  if (await fs.pathExists(join('.git'))) {
    await fs.copy(join('.git'), join('.git', newProjectDir), {
      overwrite: true,
    });
  }

  if (await fs.pathExists(join('cli.js'))) {
    await fs.copyFile(join('cli.js'), join('cli.js', newProjectDir));
  }
}

async function runCharlike(pkg, upperDir, options) {
  const { deps, devDeps } = await latestDeps(pkg);

  // @TODO: move above the `const join` and `fs.mkdirp` when support
  // the new `settings.ignore` and `settings.dest` options.
  await charlike(
    mixinDeep(
      {
        project: { name: pkg.name, description: pkg.description },
        locals: {
          deps: `${JSON.stringify(deps, null, 4).slice(0, -1)}  }`,
          devDeps: `${JSON.stringify(devDeps, null, 4).slice(0, -1)}  }`,
          license: { year: pkg.licenseStart, name: pkg.license },
          version: await get(pkg.name, 'version'),
        },
      },
      options,
      { cwd: upperDir },
    ),
  );
}

async function latestDeps(pkg) {
  const deps = Object.assign({}, pkg.dependencies, {
    esm: `^${await get('esm', 'version')}`,
  });

  const latestConfig = await get('@tunnckocore/config', 'version');
  const latestScripts = await get('@tunnckocore/scripts', 'version');
  const devDeps = Object.assign({}, pkg.devDependencies, {
    '@tunnckocore/config': `^${latestConfig}`,
    '@tunnckocore/scripts': `^${latestScripts}`,
    asia: `^${await get('asia', 'version')}`,
  });

  return { deps, devDeps };
}
