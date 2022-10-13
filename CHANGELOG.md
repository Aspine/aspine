# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.9.0] - tagged 2022-09-04, production 2022-09-13
- Updated Aspine School Year 2022-2023 (#[340])
     - Added New Schedule including Timing, Lunches, and Falcon Blocks
     - Fixed Scraping and table population methods due to Aspen changes
- Tables have been redesigned for a better viewing experience on mobile devices (#[330])
- Changed wording of "Cumulative GPA" to "Yearly GPA" for clarification (#[329])

## [2.8.2] - tagged 2021-10-05, production 2021-10-06
- Add support for fall 2021 schedule ([#311], [#308])
- Hide PE RSTA on grades tab ([#310])
- Small edits to `login.js` ([#305])
- Clarify software license to be GPL version 3 or later ([#282], [#38])

## [2.8.1] - tagged 2021-05-08, production 2021-05-12
- Hotfix for lunch detection after changes to Aspen and to lunch assignments

## [2.8.0] - tagged 2021-05-08
- Add support for getting grades from previous year ([#287], [#99])
- Add support for May-June 2021 schedule, and guess students' lunch based on
  their third period class ([#294], [#288], [#95])
- Modularize and refactor parts of the codebase ([#290], [#253], [#296], [#300])

## [2.7.1] - tagged 2021-04-01, production 2021-04-08
- Allow undoing the deletion of assignments using an "undo" button or
  <kbd>Ctrl</kbd>+<kbd>Z</kbd> ([#222], [#171])
- Display period start/end times in the schedule ([#283], [#260])
- Make "remember me" keep users logged in, instead of saving their login info
  ([#281], [#246])
- Remove classes without grades (e.g., Study Support) from Grades tab ([#280],
  [#265])
- Show class names for Study Support on the schedule ([#280], [#259])
- Make colors for grades more consistent and readable in dark mode ([#286],
  [#284])
- Handle Aspen outages and other errors more gracefully ([#278], [#277])

## [2.7.0] - tagged 2021-02-24, production 2021-02-26
- Migrate to a new API for getting data from Aspen ([#220], [#184]). This is a
  **major** change and fixes many issues in Aspine, such as:
  + Show all assignments for each class, not just the first page on Aspen
    ([#170])
  + Display all reports in the Reports tab ([#90])
  + Fix a bug where some classes showed the wrong assignments when switching
    terms ([#113])
  + Clean up properly after sessions on Aspen ([#163])
  + Make the backend type-safe (works toward [#153])
- Notify the user upon an invalid login ([#272], [#226])
- Style the day-of-week picker in the schedule tab ([#262])
- In the info tab, show release notes back to the latest minor version instead
  of hard-coding "past three versions" ([#270], [#264])
- Fix bugs with period name detection in the schedule and clock ([#268], [#267],
  [#274])
- Fix bug where editing the category of an assignment showed "NaN%" ([#273])
- Rewrite the build script for
  [Aspine Lite](https://github.com/Aspine/aspine#aspine-lite) in JavaScript
  ([#271], [#250])

## [2.6.4] - tagged 2021-02-08
- Hotfix for schedule after changes on Aspen
- Update dependencies

## [2.6.3] - tagged 2021-02-07
- Change schedule tab to follow semester 2 schedule and replace black/silver
  slider with day-of-week picker ([#257], [#256])
- Update clock to follow semester 2 schedule ([#255], [#247])
- Stop the current quarter from being grayed out when teachers have not entered
  any grades into Aspen ([#258], [#254])
- Tooling changes for developers ([#251], [#252])

## [2.6.2] - tagged 2021-01-31
- Display recent changes under info tab ([#240], [#174])
- Update dark mode in real time when the user changes their system color scheme
  ([#237], [#235])
- Update Aspine for quarter 3 ([#249], [#248])
- Fix bug with highlighting in sidenav on small and medium screen sizes ([#225],
  [#211])
- Fix period numbering under clock ([#242], [#199], [#212])
  + The effects of this change currently cannot be seen, as displaying periods
    in the clock has been temporarily disabled due to the semester 2 schedule.
- Update `README.md` ([#245])
- Simplify command-line interface of Aspine server ([#233], [#234], [#239])
- Performance improvements and housekeeping ([#223], [#228], [#229], [#230])

## [2.6.1] - tagged 2020-12-20, production 2020-12-22
- Improve session handling ([#219], [#218])
- Fix size of district logo on login page ([#221])

## [2.6.0] - tagged 2020-12-16
- Dark mode ([#195], [#146], [#213], [#210])
- Fix "Schedule" tab to work with the covid-19 remote learning schedule ([#198],
  [#140])
- Collapse navigation bar into hamburger menu (side navigation) on small screens
  ([#164], [#152])
- Show tooltips when hovering over UI elements ([#205], [#178])
- Add "Info" tab with information about Aspine ([#204], [#76])
- Improve design of login page ([#179], [#142], [#196], [#192])
- Make "remember me" more secure by only storing the username ([#207])
- Tweak grades table margins to be more consistent ([#215])
- Change mouse cursor in header and small clock ([#186])
- Change icon for assignment statistics and make colors more consistent ([#183],
  [#185])
- Reword `<meta>` tag on login and home pages ([#216], [#191])
- Make a 404 page ([#190], [#188])
- Remove extraneous redirects to improve page load time ([#208], [#209])

## [2.5.1] - tagged 2020-11-18, production 2020-11-20
- Modify Aspine header onclick behavior ([#177], [#168])
- Fix confusing message when editing assignments ([#176])

## [2.5.0] - tagged 2020-11-17
- Update "Recent Activity" (now renamed "Attendance") in light of changes due to
  covid-19 ([#166], [#144], [#159])
- Add support for covid-19 schedule and fix time zone handling in clock
  ([#145], [#84])
- Make "Add assignment" button add to the currently selected category ([#162])
- Stop offering to show nonexistent statistics for assignments added by the user
  that are not actually in Aspen ([#149])
- Add download button to Reports tab ([#147], [#143])
- Use `requestAnimationFrame` for clock instead of `setInterval` ([#151],
  [#135])
- Add JSDoc comments ([#128], works toward [#153])
- Change `Example app listening on port ${port}!` to `Aspine listening on port
  ${port}!`
- Fix clock alignment
- Update dependencies

## [2.4.3] - tagged 2020-10-13, production 2020-10-13
- Added client-side "remember me" feature ([#141], [#112])

## [2.4.2] - tagged 2020-09-30
- Changes to adapt to the covid-19 fall reopening
  + Roll over from quarter 4 to quarter 1
  + Adapt the schedule code to follow the new format for remote learning
- Fix bugs
  + Center logo on login page
  + Fix "NaN" showing when a class does not have GPA data
  + Fix bug in which Aspine refused to load when a class had no assignments
- Update dependencies
- Clean up formatting ([#126])
- Update documentation ([#139], [#131])

## [2.4.1] - tagged 2020-08-18, production 2020-08-27
- Fix bug in `build-lite.sh`

## [2.4.0] - tagged 2020-08-18
- Add test corrections feature ([#127], [#72])
- Reimplement stats plot in d3, along with other optimizations to make Aspine
  lighter ([#123], [#125], [#122])
- Change `build-lite.sh` to portable POSIX sh syntax ([#121])
- Update dependencies

## [2.3.0] - tagged 2020-05-03
- Client-side JSON import/export feature ([#119], [#74])
  + Introduce a "lite" version of Aspine which can be used offline with
    exported JSON files (does not support fetching new data from Aspine)
- Update dependencies

## [2.2.2] - tagged 2020-04-21
- Display version number on Aspine ([#118])
- Add message for users who have JavaScript disabled ([#118])
- Create `MAINTENANCE.md` with information about tagging new releases
- Add `.editorconfig` file to make it easier for contributors to have
  consistent code style

## [2.2.1] - tagged 2020-04-11
- Bug fixes
  + Fix a file path in package.json
  + Fix some issues relating to switching between types of GPA
    (percent, unweighted, and weighted)
- Improve offline functionality ([#115])
- Update Aspine for quarter 4

## [2.2.0] - tagged 2020-03-24
- Clean up code ([#108], [#96])
  + Reorganize files
  + Remove unneeded dependencies
  + Update dependencies
  + Remove unused files, functions, methods, etc.
  + Reformat code
- Create `CHANGELOG.md`

## [2.1.0] - tagged 2020-03-24
- Update macOS install scripts ([#101], [#83])
- Support unweighted (4.0 scale) and weighted (5.0 scale) GPA ([#101], [#71])
- Fix PDF viewer (Reports tab) to work with the update to Aspen on
  14 January 2020 ([#103])
- Support automatic resizing of PDF viewer upon entering/exiting fullscreen
  ([#103], [#89])
- Support viewing multiple pages of a PDF document in the PDF viewer
  ([#103], [#88])
- Refactor `package.json` to align with `npm` documentation ([#106])

## [2.0.1] - tagged 2020-03-24
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
[2.2.1]: https://github.com/Aspine/aspine/releases/tag/v2.2.1
[2.2.2]: https://github.com/Aspine/aspine/releases/tag/v2.2.2
[2.3.0]: https://github.com/Aspine/aspine/releases/tag/v2.3.0
[2.4.0]: https://github.com/Aspine/aspine/releases/tag/v2.4.0
[2.4.1]: https://github.com/Aspine/aspine/releases/tag/v2.4.1
[2.4.2]: https://github.com/Aspine/aspine/releases/tag/v2.4.2
[2.4.3]: https://github.com/Aspine/aspine/releases/tag/v2.4.3
[2.5.0]: https://github.com/Aspine/aspine/releases/tag/v2.5.0
[2.5.1]: https://github.com/Aspine/aspine/releases/tag/v2.5.1
[2.6.0]: https://github.com/Aspine/aspine/releases/tag/v2.6.0
[2.6.1]: https://github.com/Aspine/aspine/releases/tag/v2.6.1
[2.6.2]: https://github.com/Aspine/aspine/releases/tag/v2.6.2
[2.6.3]: https://github.com/Aspine/aspine/releases/tag/v2.6.3
[2.6.4]: https://github.com/Aspine/aspine/releases/tag/v2.6.4
[2.7.0]: https://github.com/Aspine/aspine/releases/tag/v2.7.0
[2.7.1]: https://github.com/Aspine/aspine/releases/tag/v2.7.1
[2.8.0]: https://github.com/Aspine/aspine/releases/tag/v2.8.0
[2.8.1]: https://github.com/Aspine/aspine/releases/tag/v2.8.1
[2.8.2]: https://github.com/Aspine/aspine/releases/tag/v2.8.2
[Unreleased]: https://github.com/Aspine/aspine/tree/master

[#38]: https://github.com/Aspine/aspine/issues/38
[#71]: https://github.com/Aspine/aspine/issues/71
[#72]: https://github.com/Aspine/aspine/issues/72
[#74]: https://github.com/Aspine/aspine/issues/74
[#76]: https://github.com/Aspine/aspine/issues/76
[#83]: https://github.com/Aspine/aspine/issues/83
[#84]: https://github.com/Aspine/aspine/issues/84
[#88]: https://github.com/Aspine/aspine/issues/88
[#89]: https://github.com/Aspine/aspine/issues/89
[#90]: https://github.com/Aspine/aspine/issues/90
[#95]: https://github.com/Aspine/aspine/issues/95
[#96]: https://github.com/Aspine/aspine/issues/96
[#99]: https://github.com/Aspine/aspine/issues/99
[#112]: https://github.com/Aspine/aspine/issues/112
[#113]: https://github.com/Aspine/aspine/issues/113
[#122]: https://github.com/Aspine/aspine/issues/122
[#131]: https://github.com/Aspine/aspine/issues/131
[#135]: https://github.com/Aspine/aspine/issues/135
[#140]: https://github.com/Aspine/aspine/issues/140
[#142]: https://github.com/Aspine/aspine/issues/142
[#143]: https://github.com/Aspine/aspine/issues/143
[#144]: https://github.com/Aspine/aspine/issues/144
[#146]: https://github.com/Aspine/aspine/issues/146
[#152]: https://github.com/Aspine/aspine/issues/152
[#153]: https://github.com/Aspine/aspine/issues/153
[#159]: https://github.com/Aspine/aspine/issues/159
[#163]: https://github.com/Aspine/aspine/issues/163
[#168]: https://github.com/Aspine/aspine/issues/168
[#170]: https://github.com/Aspine/aspine/issues/170
[#171]: https://github.com/Aspine/aspine/issues/171
[#174]: https://github.com/Aspine/aspine/issues/174
[#178]: https://github.com/Aspine/aspine/issues/178
[#184]: https://github.com/Aspine/aspine/issues/184
[#185]: https://github.com/Aspine/aspine/issues/185
[#188]: https://github.com/Aspine/aspine/issues/188
[#191]: https://github.com/Aspine/aspine/issues/191
[#192]: https://github.com/Aspine/aspine/issues/192
[#199]: https://github.com/Aspine/aspine/issues/199
[#210]: https://github.com/Aspine/aspine/issues/210
[#211]: https://github.com/Aspine/aspine/issues/211
[#212]: https://github.com/Aspine/aspine/issues/212
[#218]: https://github.com/Aspine/aspine/issues/218
[#226]: https://github.com/Aspine/aspine/issues/226
[#235]: https://github.com/Aspine/aspine/issues/235
[#246]: https://github.com/Aspine/aspine/issues/246
[#247]: https://github.com/Aspine/aspine/issues/247
[#248]: https://github.com/Aspine/aspine/issues/248
[#250]: https://github.com/Aspine/aspine/issues/250
[#253]: https://github.com/Aspine/aspine/issues/253
[#254]: https://github.com/Aspine/aspine/issues/254
[#256]: https://github.com/Aspine/aspine/issues/256
[#259]: https://github.com/Aspine/aspine/issues/259
[#260]: https://github.com/Aspine/aspine/issues/260
[#264]: https://github.com/Aspine/aspine/issues/264
[#265]: https://github.com/Aspine/aspine/issues/265
[#267]: https://github.com/Aspine/aspine/issues/267
[#277]: https://github.com/Aspine/aspine/issues/277
[#284]: https://github.com/Aspine/aspine/issues/284
[#288]: https://github.com/Aspine/aspine/issues/288
[#308]: https://github.com/Aspine/aspine/issues/308
[#98]: https://github.com/Aspine/aspine/pull/98
[#101]: https://github.com/Aspine/aspine/pull/101
[#103]: https://github.com/Aspine/aspine/pull/103
[#106]: https://github.com/Aspine/aspine/pull/106
[#108]: https://github.com/Aspine/aspine/pull/108
[#109]: https://github.com/Aspine/aspine/pull/109
[#115]: https://github.com/Aspine/aspine/pull/115
[#118]: https://github.com/Aspine/aspine/pull/118
[#119]: https://github.com/Aspine/aspine/pull/119
[#121]: https://github.com/Aspine/aspine/pull/121
[#123]: https://github.com/Aspine/aspine/pull/123
[#125]: https://github.com/Aspine/aspine/pull/125
[#126]: https://github.com/Aspine/aspine/pull/126
[#127]: https://github.com/Aspine/aspine/pull/127
[#128]: https://github.com/Aspine/aspine/pull/128
[#139]: https://github.com/Aspine/aspine/pull/139
[#141]: https://github.com/Aspine/aspine/pull/141
[#145]: https://github.com/Aspine/aspine/pull/145
[#147]: https://github.com/Aspine/aspine/pull/147
[#149]: https://github.com/Aspine/aspine/pull/149
[#151]: https://github.com/Aspine/aspine/pull/151
[#162]: https://github.com/Aspine/aspine/pull/162
[#164]: https://github.com/Aspine/aspine/pull/164
[#166]: https://github.com/Aspine/aspine/pull/166
[#176]: https://github.com/Aspine/aspine/pull/176
[#177]: https://github.com/Aspine/aspine/pull/177
[#179]: https://github.com/Aspine/aspine/pull/179
[#183]: https://github.com/Aspine/aspine/pull/183
[#186]: https://github.com/Aspine/aspine/pull/186
[#190]: https://github.com/Aspine/aspine/pull/190
[#195]: https://github.com/Aspine/aspine/pull/195
[#196]: https://github.com/Aspine/aspine/pull/196
[#198]: https://github.com/Aspine/aspine/pull/198
[#204]: https://github.com/Aspine/aspine/pull/204
[#205]: https://github.com/Aspine/aspine/pull/205
[#207]: https://github.com/Aspine/aspine/pull/207
[#208]: https://github.com/Aspine/aspine/pull/208
[#209]: https://github.com/Aspine/aspine/pull/209
[#213]: https://github.com/Aspine/aspine/pull/213
[#215]: https://github.com/Aspine/aspine/pull/215
[#216]: https://github.com/Aspine/aspine/pull/216
[#219]: https://github.com/Aspine/aspine/pull/219
[#220]: https://github.com/Aspine/aspine/pull/220
[#221]: https://github.com/Aspine/aspine/pull/221
[#222]: https://github.com/Aspine/aspine/pull/222
[#223]: https://github.com/Aspine/aspine/pull/223
[#225]: https://github.com/Aspine/aspine/pull/225
[#228]: https://github.com/Aspine/aspine/pull/228
[#229]: https://github.com/Aspine/aspine/pull/229
[#230]: https://github.com/Aspine/aspine/pull/230
[#233]: https://github.com/Aspine/aspine/pull/233
[#234]: https://github.com/Aspine/aspine/pull/234
[#237]: https://github.com/Aspine/aspine/pull/237
[#239]: https://github.com/Aspine/aspine/pull/239
[#240]: https://github.com/Aspine/aspine/pull/240
[#242]: https://github.com/Aspine/aspine/pull/242
[#245]: https://github.com/Aspine/aspine/pull/245
[#249]: https://github.com/Aspine/aspine/pull/249
[#251]: https://github.com/Aspine/aspine/pull/251
[#252]: https://github.com/Aspine/aspine/pull/252
[#255]: https://github.com/Aspine/aspine/pull/255
[#257]: https://github.com/Aspine/aspine/pull/257
[#258]: https://github.com/Aspine/aspine/pull/258
[#262]: https://github.com/Aspine/aspine/pull/262
[#268]: https://github.com/Aspine/aspine/pull/268
[#270]: https://github.com/Aspine/aspine/pull/270
[#271]: https://github.com/Aspine/aspine/pull/271
[#272]: https://github.com/Aspine/aspine/pull/272
[#273]: https://github.com/Aspine/aspine/pull/273
[#274]: https://github.com/Aspine/aspine/pull/274
[#278]: https://github.com/Aspine/aspine/pull/278
[#280]: https://github.com/Aspine/aspine/pull/280
[#281]: https://github.com/Aspine/aspine/pull/281
[#282]: https://github.com/Aspine/aspine/pull/282
[#283]: https://github.com/Aspine/aspine/pull/283
[#286]: https://github.com/Aspine/aspine/pull/286
[#287]: https://github.com/Aspine/aspine/pull/287
[#290]: https://github.com/Aspine/aspine/pull/290
[#294]: https://github.com/Aspine/aspine/pull/294
[#296]: https://github.com/Aspine/aspine/pull/296
[#300]: https://github.com/Aspine/aspine/pull/300
[#305]: https://github.com/Aspine/aspine/pull/305
[#310]: https://github.com/Aspine/aspine/pull/310
[#311]: https://github.com/Aspine/aspine/pull/311
