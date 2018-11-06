#!/usr/bin/env node

'use strict';

/* eslint-disable promise/always-return */

const proc = require('process');
const charlike = require('charlike');

const update = require('./index');
const pkg = require('./package.json');

(async function main() {
  const argv = await charlike.cli(showHelp, proc.argv.slice(2), {
    pkg,
    isUpdate: true,
  });

  try {
    const { ranInCwd, cwd } = await update(argv._[0], argv);
    console.log('Updating your project has finished.');

    if (ranInCwd) {
      console.log('Make sure to open current folder again: cd', cwd);
    }
  } catch (err) {
    console.error(';( Oooh, crap! Some error happened.');
    console.error(argv.verbose ? err.stack : err.message);
    proc.exit(1);
  }
})();

function showHelp(exitCode = 0) {
  const log = exitCode === 0 ? console.log : console.error;

  log(`  update v${pkg.version}
  ${pkg.description}

  Usage: update [dirName] [flags]

  Common Flags:
    -h, --help                Display this help.
    -v, --version             Display current version.

  Flags:
    -d, --desc                Project description, short for "--project.description".
    -o, --owner               Usually your GitHub username or organization.
    -t, --templates           Source templates directory.
    --engine                  Engine to be used in the template files.
    --locals                  Locals for the template files. Support dot notation.
    --locals.author.name      Project's author name.
    --locals.author.email     Project's author email. And so on.
    --project                 Project metadata like name, description
    --project.name            Project name.
    --project.description     Project description.
    --cwd                     Folder to be used as current working dir.
    --ly                      Shortcut for --locals.license.year (license start year).
    --ln                      Set --locals.license.name.

  Examples:
    update foobar --locals.author.name 'John Snow'
    update foobar --locals.license 'Apache-2.0' --locals.foo bar

  Useful when transferring to another org or user:
    update foobar --owner tunnckoCoreLabs

  Useful when switching license:
    update my-project-dir --ly 2015 --ln MIT
  `);

  proc.exit(exitCode);
}
