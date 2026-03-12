# Test Cases

## Test Case 1: Website loads successfully
**Description:** Confirms that the website opens and displays project content.

**Input:** Open `website/Web.html` in a browser.

**Expected Output:** The project webpage loads without a file-not-found error.

---

## Test Case 2: Grocery importer dependencies install successfully
**Description:** Confirms that the Node.js importer setup is valid.

**Input:** Run `npm install` inside `grocery-importer/`.

**Expected Output:** Required packages install without critical errors.

---

## Test Case 3: Database connection works
**Description:** Confirms that a group member can log into MariaDB and select the project database.

**Input:** Valid MariaDB login command and valid credentials.

**Expected Output:** Successful login and ability to run:
`USE grocery_inflation;`

---

## Test Case 4: Monthly average calculation is correct
**Description:** Confirms that a monthly average from four weekly prices is calculated correctly.

**Input:**
- week_1_price = 2.99
- week_2_price = 3.19
- week_3_price = 3.09
- week_4_price = 3.29

**Expected Output:**
- monthly_average = 3.14

---

## Test Case 5: Sliding 12-month logic returns latest 12 months
**Description:** Confirms that only the most recent 12 monthly entries are displayed.

**Input:** More than 12 months of records for one item.

**Expected Output:** Query output shows only the newest 12 months in correct order.
