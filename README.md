# Aspine

Who needs Aspen when you have Aspine! It serves as a one stop shop for everything Aspen related, and actually looks nice! 

## Getting Started

Using Aspine is as easy as 1, 2, 3. Just visit aspine.us and login with your Aspen credentials!

## Features

* Everything Aspen, but better!
* CRLS Clock

![CRLS Clock Image](images/crls_clock.png)

* Grade Comparison via boxplot

![Example Boxplot Image](images/boxplot.png)

* Calendar

![Example Calendar Image](images/calendar.png)

* Chat with your classmates (coming soon...)


## Built With
* [Tabulator](https://github.com/olifolkerd/tabulator)
* [Plotly](https://plot.ly/javascript/)
* [CRLS Clock](https://github.com/CRLSCSClub/CRLSTime)
* [Full Calendar](https://fullcalendar.io/)

## Contributing

Feel free to suggest an enhancement or post a bug issue either via github issues or this [google form](https://goo.gl/forms/PYQDtzkp0vHJbFLz2)!

If you would like to directly contribute to Aspine, you can fork this repository and clone your fork on your computer with a [git](https://git-scm.com/) client. To test your additions to Aspine:

* Make sure that you have installed [node.js](https://nodejs.org/), npm, and [redis](https://redis.io/).
  * On Windows or macOS, download node.js and redis from their websites, and install them.
  * On GNU+Linux, you should be able to find these in your package manager (e.g. `apt`/`dpkg`, `yum`/`dnf`, `zypper`, `pacman`). npm may be in a separate package from node.js.
* Open a terminal or command prompt, navigate to the directory in which you cloned the Aspine git repository, and run `redis-server redis.conf`.
* Open another terminal or command prompt, navigate to that same directory, and run `node ./serve.js insecure`, or `node ./serve.js insecure fake` to use the `sample.json` file instead of pulling from Aspen (for faster testing).

These instructions have only been tested on GNU+Linux. You might need to change your `PATH` on Windows if you get an error saying that `node` is not found after installing node.js.

## Authors

* [**Max Katz-Christy**](https://github.com/maxtkc)
* [**Cole Killian**](https://github.com/ruborcalor)


## [Color Scheme](http://paletton.com/#uid=12W0u0kw0e-n8nFrjj8Hz9QS55d)

![Color Palette](images/color_palette.png)

```
Primary Color: #00551D
Secondary Colors:
 - #268A48
 - #107031
 - #003913
 - #001E0A
```

## License

This project is licensed under the GNU General Public License, version 3 - see the [LICENSE.md](LICENSE.md) file for details.
