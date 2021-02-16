# Maintenance

This file is meant for noting information relating to project maintenance
so that maintainers have a written record of key procedures.

## Tagging a release

GitHub provides a "Releases" mechanism that offers to tag releases
automatically, but this creates lightweight tags and not annotated tags,
which means that `git describe` will ignore any tags created from GitHub's
website.

Before tagging a release, increment the version number in package.json and
run `npm install` to update package-lock.json.

To tag a release, first run `git tag -s v$MAJOR.$MINOR.$PATCH $REF`,
replacing `$MAJOR.$MINOR.$PATCH` with the version number
(following [semantic versioning][1]) and replacing `$REF` with the ref
(usually a commit or branch) which should be tagged
(this defaults to the current `HEAD`).
Replace `-s` with `-a` if you do not have an OpenPGP key set up with Git
and linked to your GitHub account.

For the tag message, add the changelog entry for the release with any other
pertinent information before the changelog entry. As with commit messages,
remember to wrap lines at 72 characters. Do not use Markdown syntax in the tag
message&mdash;symbols from code or filenames can be used without backticks and
pull request or issue numbers can be kept as `#xxx` without a URL.

Do not include any information in the tag description that you expect to change
in the near future (e.g. "this version has not yet been put on the production
server"). Such information can be included in the "Release" on GitHub.

To publish the tag, run `git push --tags`.

After tagging a release, click on "Draft a new release" under "Releases"
and select the newly created tag. Use the version number (without `v`)
as the release title and the tag description (with any mutable information
as necessary) as the release description. Markdown syntax may be used here.
Run `build-lite.sh` and attach a zip and a tarball of the lite version
(in the directory `dist-lite`) to the release.

[1]: https://semver.org/spec/v2.0.0.html

## Modifying a tag message

If, for some reason, you need to modify a tag message, run
`git tag -sf $TAG $TAG^{}` (replacing `$TAG` with the name of the tag)
and update the message. To publish the tag, run `git push -f --tags`.

## Moving a tag

If some extraordinary circumstance necessitates that a tag be moved to another
commit, this can be done using `git tag -f $TAG $REF` where `$TAG` is the name
of the tag and `$REF` is the ref to which the tag should now point.
The newly moved tag can be published with `git push -f --tags`.

[#82]: https://github.com/Aspine/aspine/issues/82
