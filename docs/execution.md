# Execution Instructions

## Website
Open the hosted website link or open `website/Web.html` locally in a browser.

## Grocery Importer
1. Navigate into the `grocery-importer/` folder.
2. Run the importer or server files as needed using Node.js.
3. Use sample grocery data files or spreadsheet exports as input if applicable.

## Database
1. Connect to MariaDB.
2. Select the project database using:
   `USE grocery_inflation;`
3. Run SQL files from the `database/` folder as needed.

## Data Update Workflow
1. Record weekly grocery prices in the spreadsheet.
2. Standardize names and substitutions.
3. Import or insert the data into the database.
4. Recalculate monthly averages.
5. Refresh the website display if needed.
