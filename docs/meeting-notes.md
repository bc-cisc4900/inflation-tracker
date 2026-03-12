# Meeting Notes

## 2026-02-03
### Objective
Establish foundational requirements, infrastructure, and project expectations.

### Main Notes
- Documentation is imperative. If it is not documented, it effectively does not exist.
- The project needs a website, a database, and a Git repository.
- A database manager should be accessible through the website with an adequate API.
- Package size matters and all items must be of comparable quality.
- The group is too small to break into subgroups, so responsibilities must still be clearly assigned.
- If Prof. Gross does not require a specific format, any reasonable and structured format is acceptable.
- Mock data may be used at the beginning to test the system.

---

## 2026-02-10
### Objective
Define project direction, clarify roles, and establish technical and presentation goals.

### Main Notes
- Record prices once per week.
- Ignore loyalty-card specific prices.
- Promotional and sale prices may be included.
- Publish a monthly average price for each item.
- The website can initially display spreadsheet-like data and leave graphs as a future enhancement.
- Focus on showing process and progress during the demo, not just the final product.
- Begin using MariaDB as the main database system.
- The team should prioritize getting a working prototype up and running.

---

## 2026-02-19
### Objective
Resolve database connectivity and website hosting issues.

### Main Notes
- Visit the IT Center to troubleshoot MariaDB and hosting issues.
- If needed, consult Prof. Thurm for database connectivity help.
- Confirm deployment and connection steps for the web server.
- If direct database connection fails, use a fallback file-based solution such as JSON or CSV output.
- The group successfully established a functional database, but stable web/database connectivity still needed work.

---

## 2026-02-26
### Objective
Clarify pricing methodology, server access issues, and database display behavior.

### Main Notes
- In-person shelf prices are preferred over website prices because online prices can be inaccurate or outdated.
- Local store pricing may differ from what appears online.
- The website is accessible through the numeric address even when the literal domain behaves incorrectly.
- The database should support sliding / rotating display logic so only the most recent 12 months are shown.
- The system should show weekly records and monthly averages in correct chronological order.

---

## 2026-03-05
### Objective
Add FreshDirect, define data schema expectations, and push automation planning forward.

### Main Notes
- Add FreshDirect to the tracked store list.
- Continue implementing or planning the monthly sliding 12-month logic.
- If automation is not finished, document the manual procedure clearly.
- Each item record should include store, month, year, four weekly price slots, and a monthly average.
- Work should be distributed more evenly across the group.
- Begin thinking about poster preparation for the end-of-semester presentation.
