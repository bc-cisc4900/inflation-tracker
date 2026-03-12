# Expected Outputs

## Expected Output 1: Website Load
The website should open and display:
- project title
- tracker section
- method section
- contact section
- embedded Google Sheet or working external link

## Expected Output 2: Database Record
A valid grocery price record should store:
- store_id
- item_id
- date_recorded
- weekly price field(s)
- monthly average
- optional notes

## Expected Output 3: Monthly Average
Input:
- 2.99
- 3.19
- 3.09
- 3.29

Expected Result:
- monthly average = 3.14

## Expected Output 4: Sliding 12-Month Query
For a selected item, the query should return:
- no more than 12 most recent records
- ordered by date descending
- store and item names joined correctly

## Expected Output 5: Substitution Documentation
When an exact product is unavailable, the stored record should still include:
- the correct item category
- a comparable replacement
- notes describing the substitution
