# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.1] - tagged 2020-04-11, production TBD
- Bug fixes
  + Fix a file path in package.json
  + Fix some issues relating to switching between types of GPA (percent, unweighted, and weighted)
- Improve offline functionality ([#115])
- Update Aspine for quarter 4

## [2.2.0] - tagged 2020-03-24, production TBD
- Clean up code ([#108], [#96])
  + Reorganize files
  + Remove unneeded dependencies
  + Update dependencies
  + Remove unused files, functions, methods, etc.
  + Reformat code
- Create `CHANGELOG.md`

## [2.1.0] - tagged 2020-03-24, production TBD
- Update macOS install scripts ([#101], [#83])
- Support unweighted (4.0 scale) and weighted (5.0 scale) GPA ([#101], [#71])
- Fix PDF viewer (Reports tab) to work with the update to Aspen on 14 January 2020 ([#103])
- Support automatic resizing of PDF viewer upon entering/exiting fullscreen ([#103], [#89])
- Support viewing multiple pages of a PDF document in the PDF viewer ([#103], [#88])
- Refactor `package.json` to align with `npm` documentation ([#106])

## [2.0.1] - tagged 2020-03-24, production TBD
- Update `README.md` to use new domain name
- Promote new iOS app to iOS users
- Make login form autofocus
- Add privacy policy and logo placeholder
- Create `greetings.yml` to welcome new contributors ([#109])

## [2.0.0-2020-02-10]

- First tagged release
- Version to go on production server on 10 February 2020
- Fix the scraper to work with the update to Aspen on 14 January 2020 ([#98])

[2.0.0-2020-02-10]: https://github.com/Aspine/aspine/releases/tag/2020-02-10
[2.0.1]: https://github.com/Aspine/aspine/releases/tag/v2.0.1
[2.1.0]: https://github.com/Aspine/aspine/releases/tag/v2.1.0
[2.2.0]: https://github.com/Aspine/aspine/releases/tag/v2.2.0

[#71]: https://github.com/Aspine/aspine/issues/71
[#83]: https://github.com/Aspine/aspine/issues/83
[#88]: https://github.com/Aspine/aspine/issues/88
[#89]: https://github.com/Aspine/aspine/issues/89
[#96]: https://github.com/Aspine/aspine/issues/96
[#98]: https://github.com/Aspine/aspine/pull/98
[#101]: https://github.com/Aspine/aspine/pull/101
[#103]: https://github.com/Aspine/aspine/pull/103
[#106]: https://github.com/Aspine/aspine/pull/106
[#108]: https://github.com/Aspine/aspine/pull/108
[#109]: https://github.com/Aspine/aspine/pull/109
[#115]: https://github.com/Aspine/aspine/pull/115
