# Skeleton Project

This is a skeleton template for a TypeScript library project, containing all the default files and settings required for a balena project.
As a result package-lock files are disabled so that upstream dependency issues are surfaces on our CI.
In case that you are implementing a standalone project, you can enable them by deleting the `.npmrc`.

Modify the `package.json`, and README.md file as required, `npm install`, then implement code in the `lib` directory. 

Compiled code will be output into the `build` directory (transpiled JS, declaration files and source maps).

`npm test` will run the tests on both node and a browser.
In case that you are implementing a node only library, you can just just drop karma.conf.js and all karma related references in the package.json.

## Integrating with balenaCI

After cloning & scaffolding the repository
* Reset the package.json version to the desired one for the initial release, eg `0.1.0`.
* Delete the CHANGELOG.md & .versionbot folder.
* Set the appropriate .github/CODEOWNERS.
* Push the scaffolded project to `master`
* Create a new branch and open a PR for it.
* After balenaCI picks up the PR, go to the repository's settings page and add a
  `master` branch protection rule and mark the balenaCI checks as required.
