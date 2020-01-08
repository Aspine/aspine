@echo off

echo INSTALL SCRIPT 1.
echo.
echo This is the first of two scripts that will install to your computer
echo the prerequisites for hosting Aspine: Chocolatey, Node.js, and Redis.
echo.
echo This script will check your system information and install Chocolatey.
echo If you already have installed Chocolatey on your computer, you may
echo skip this script and directly run "install2.bat".
echo.
echo If you are not sure whether Chocolatey is installed on your computer,
echo open a new Command Prompt window and try running "choco"
echo (excluding quotation marks).
echo If you do not see a "not found" or "not recognized" error
echo (do not worry about other errors), then Chocolatey is already installed
echo and you may safely skip to the second script.
echo.
echo Press CTRL-C now if you do not wish to continue.
echo.
pause
echo.
goto :check_details

:check_details
echo The details of your Windows installation will be checked in order to make sure
echo that your computer is supported by the tools necessary to host Aspine.
echo.
echo Checking Windows details...
setlocal
for /f "tokens=4-5 delims=. " %%i in ('ver') do set version=%%i.%%j
rem https://stackoverflow.com/a/34317898

if exist "%ProgramFiles(x86)%" (set bitness=64) else (set bitness=32)
rem :: https://msfn.org/board/topic/129674-how-can-i-identify-if-os-is-32-bit-or-64-bit-in-batch-file/?tab=comments#comment-853710

echo Version: %version%
echo Bitness: %bitness%-bit
echo.
if %bitness% neq 64 goto :check_details_failure_bitness
if %version% geq 6.1 goto :check_details_success
if %version% == 10.0 goto :check_details_success
goto :check_details_failure_version

:check_details_success
echo Your computer is running 64-bit Windows 7 or newer,
echo so the development environment will be installed.
echo.
goto :check_permissions

:check_details_failure_bitness
echo Your computer is running a 32-bit operating system and cannot run Redis.
goto :check_details_failure_guidance

:check_details_failure_version
echo Your computer is running a Windows operating system older than Windows 7
echo and is unsupported by the tools used in Aspine development.
goto :check_details_failure_guidance

:check_details_failure_guidance
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
goto :choco

:check_permissions_failure
echo Failure: Current permissions inadequate.
echo To run this script as an administrator,
echo right-click on "install1.bat" and click "Run as administrator".
echo.
echo Press any key to close this window.
pause
goto :eof

:choco
echo Installing Chocolatey...
echo.
powershell Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
echo.
echo If there was an error in installing Chocolatey, please run this script
echo again and/or fix any problems identified by the Chocolatey installer in
echo the above output.
echo.
echo If you see the text "Chocolatey (choco.exe) is now ready" above,
echo Chocolatey has been successfully installed and you may safely proceed to
echo the next step.
echo Please close this Command Prompt window and run the next script,
echo install2.bat, as an administrator, by right-clicking on it and clicking
echo "Run as administrator".

:eof
