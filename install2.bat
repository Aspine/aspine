@echo off

echo INSTALL SCRIPT 2.
echo.
echo This is the second of two scripts that will install to your computer
echo the prerequisites for hosting Aspine: Chocolatey, Node.js, and Redis.
echo.
echo This script assumes that Chocolatey is already installed on your computer.
echo If you are unsure, open a new Command Prompt window and try running "choco"
echo (excluding quotation marks).
echo If you see a "not found" or "not recognized" error
echo (do not worry about other errors), then you must run the script "install1.bat"
echo (the word "install" followed by a numeral one) before running this script.
echo.
echo Press CTRL-C now if you do not wish to continue.
echo.
pause
echo.
goto :check_bitness

:check_bitness
echo The bitness of your Windows installation will now be checked in order to make
echo sure that your computer is supported by the tools necessary to host Aspine.
echo.
if exist "%ProgramFiles(x86)%" (set bitness=64) else (set bitness=32)
rem :: https://msfn.org/board/topic/129674-how-can-i-identify-if-os-is-32-bit-or-64-bit-in-batch-file/?tab=comments#comment-853710
echo Bitness: %bitness%-bit
echo.
if %bitness% == 64 goto :check_bitness_success
goto :check_bitness_failure

:check_bitness_success
echo Your computer is running a 64-bit operating system, so the script will proceed.
echo.
goto :check_permissions

:check_bitness_failure
echo Your computer is running a 32-bit operating system and cannot run Redis.
echo Please consider switching to a non-Microsoft operating system
echo (e.g. Ubuntu, Linux Mint, Fedora, Debian, openSUSE, Arch Linux, FreeBSD)
echo in order to install the necessary tools to host Aspine on your computer.
echo If you are using a Mac in Boot Camp, you can try running the Mac install script
echo (install.sh) to install the development environment.
goto :eof

:check_permissions
echo Administrative permissions required. Detecting permissions...
net session >nul 2>&1
rem https://stackoverflow.com/a/11995662

if %errorlevel% == 0 (
	goto :check_permissions_success
) else (
	goto :check_permissions_failure
)

:check_permissions_success
echo Success: Administrative permissions confirmed.
echo.
pause
echo.
goto :nodejs

:check_permissions_failure
echo Failure: Current permissions inadequate.
echo To run this script as an administrator:
echo 1) Open the Start menu or Start screen. This is typically done by moving
echo    your mouse pointer to the lower left-hand corner of your screen and
echo    clicking.
echo 2) Type "cmd", excluding the quotation marks.
echo 3) Press CTRL-SHIFT-ENTER.
echo 4) Agree to any prompts asking for authorization of administrative action,
echo    providing passwords as necessary.
echo 5) Type "cd" (excluding quotation marks), followed by a space, followed by
echo    the full path (enclosed in double quotes) to the directory (folder)
echo    in which you have cloned or downloaded the Aspine repository, and
echo    press ENTER on your keyboard.
echo 6) Type "install2.bat" (excluding quotation marks).
goto :eof

:nodejs
echo Installing node.js...
echo.
choco install -y nodejs
echo.
goto :redis

:redis
echo Installing Redis...
echo.
choco install -y redis-64
echo.
echo The necessary development tools have been installed.
echo You might need to restart your computer before performing the following steps;
echo if so, take a screenshot or photo of this screen before restarting your computer.
echo.
echo Please close this Command Prompt window and open a new non-administrative
echo Command Prompt window (this can be done by typing "cmd" in the Start Menu
echo and pressing ENTER without CTRL or SHIFT).
echo.
echo In the new window, type "npm install" (excluding quotation marks).
echo Once that process has completed, close that Command Prompt window.
echo To run Aspine, double-click on the file "start.bat".

:eof
