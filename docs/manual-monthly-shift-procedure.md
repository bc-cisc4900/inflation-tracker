# Manual Monthly Shift Procedure

## Purpose
If the automated sliding 12-month logic is not completed in time, this manual procedure explains how the team should update the visible 12-month range consistently.

## When This Is Done
This procedure should be performed whenever a new month of grocery data is finalized and ready to be added to the displayed dataset.

## Owner
The person responsible should be whichever team member is currently managing the database update for that month. If needed, the Project Manager or Database Architect should verify the final output.

## Steps

### 1. Finalize Weekly Data
Make sure all weekly grocery prices for the new month have been collected and reviewed.

### 2. Verify Item Consistency
Confirm that:
- item names are standardized
- substitutions are documented
- store names are correct
- package sizes and quality are reasonably comparable

### 3. Calculate Monthly Average
For each item/store combination, calculate the monthly average from the weekly price values.

### 4. Insert the New Month
Add the new month’s data into the database and any supporting spreadsheet or import file.

### 5. Check the Visible Range
Review the current displayed results and make sure only the most recent 12 months are shown for each item.

### 6. Remove or Stop Displaying the Oldest Month
If the visible list would exceed 12 months after adding the new month, the oldest month should be removed from the displayed range or excluded by query logic.

### 7. Verify Ordering
Confirm that results are shown in correct chronological order by year and month.

### 8. Save Proof
Take screenshots or save proof showing:
- the newly added month
- the calculated monthly averages
- the correct 12-month display range
- the ordering of results

## What to Save as Proof
Recommended proof includes:
- screenshot of the spreadsheet month data
- screenshot of database output or query results
- screenshot of website display if applicable
- notes explaining any substitution or unusual data issue

## Goal
The goal of this procedure is to keep the project consistent and reproducible even if the fully automated version is not yet implemented.
