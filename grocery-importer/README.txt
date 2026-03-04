grocery-importer
================

A Node.js tool that reads grocery price data from a Google Sheet and imports it into a MariaDB database.


REQUIREMENTS
------------
- Node.js v20+
- Access to the grocery_inflation MariaDB database
- Access to the Google Sheet containing weekly price data
- A Google Cloud service account with Sheets API enabled


PROJECT STRUCTURE
-----------------
grocery-importer/
├── import.js          # Standalone import script (run directly from terminal)
├── credentials.json   # Google service account key (not committed to GitHub)
├── .env               # Environment variables (not committed to GitHub)
├── package.json       # Project dependencies
└── node_modules/      # Installed libraries (not committed to GitHub)


How to run:
-----

1. Install Node.js

   UBUNTU/LINUX:
     curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
     sudo apt-get install -y nodejs

   MAC:
     Install Homebrew first if you don't have it:
       /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
     Then install Node.js:
       brew install node

   WINDOWS:
     Go to https://nodejs.org and download the LTS installer.
     Run the installer and follow the prompts.
     Restart your terminal after installation.

   Verify installation on all platforms:
     node --version
     npm --version


2. Install dependencies

   npm install


4. Create your .env file

   Create a file called .env in the project folder with the following:

     DB_HOST=serverless-us-west-2.sysp0000.db1.skysql.com
     DB_PORT=4034
     DB_USER=your_username
     DB_PASSWORD=your_password
     DB_NAME=grocery_inflation
     GOOGLE_SHEET_ID=1-U6Gy8KI-ajH7He4ksQ9dPo6TluAoBy75tu9D4PhJR4

   UBUNTU/LINUX: nano .env
   MAC:          nano .env  (or open with TextEdit)
   WINDOWS:      Create the file in Notepad, save as .env (please make sure it's not .env.txt)


5. Add your credentials.json

   Obtain the Google service account key file from your project admin and
   place it in the project folder as credentials.json.


SSL CERTIFICATE NOTE (IMPORTANT!)
--------------------
The script does not use the correct SSL certificate path. Manual configuration needed.



GOOGLE SHEET FORMAT
-------------------
Each sheet tab should be named week1, week2, week3 etc. and follow this
column structure:

   Column A  |  Item name
   Column B  |  Category
   Column C  |  Aldi price
   Column D  |  Key Food price
   Column E  |  Stop & Shop price
   Column F  |  Trader Joe's price
   Column G  |  Store Average
   Column H  |  National Average

Prices should be formatted as $0.00. Empty price cells will be stored as 0.00.


USAGE
-----

Run directly from the terminal to import a specific week:

   node import.js week1
   node import.js week2
   node import.js week3


VALIDATION
----------
Currently no implemtation of validating input from Google Sheet.


DATABASE TABLES
---------------
   items     Stores product names and categories
   stores    Stores store names
   prices    Stores weekly price records per item per store


NOTES
-----
- Never commit .env or credentials.json to GitHub as they contain sensitive credentials
- node_modules is excluded from GitHub and can be restored anytime by running npm install
- Each week should have 132 records (33 items x 4 stores)
- Items and stores must already exist in the database before importing
