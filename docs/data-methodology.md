# Data Methodology

## Weekly Collection
The team collects grocery prices once per week. This weekly collection schedule creates the raw data used for monthly averages and long-term price comparisons.

## Main Metric
The most important output is the monthly average price for each tracked item. Weekly prices are collected first, then combined to calculate a monthly average that is easier to compare across time.

## Item Consistency
To keep the data as consistent and meaningful as possible, the team tries to match:
- item type
- package size
- product quality
- product description
- unit-based comparability

Examples include using clearly defined items such as large eggs, specific milk types, or comparable rice/flour sizes.

## Shelf Price Preference
In-person shelf prices are preferred over store website prices whenever possible. This is because:
- online prices may be outdated
- local store pricing can differ from central website pricing
- managers may run local sales not reflected online
- store websites may not match what consumers actually see in person

## Promotions and Loyalty Pricing
- promotional and sale prices may be recorded
- loyalty-card specific prices should be ignored

This reflects a compromise between realistic pricing and fair comparability.

## Substitutions
If an exact item is unavailable, the closest reasonable equivalent may be used. Substitutions must be documented clearly in notes so the dataset remains transparent.

## Monthly Rotation / Sliding Window
The long-term goal is to display the most recent 12 months of data for each item. This means the system should eventually:
- keep monthly records ordered by year and month
- show weekly prices and monthly averages
- rotate out the oldest month once newer data is added

## Data Workflow
The overall workflow is:
1. define comparable grocery items
2. collect weekly store prices
3. standardize names and substitutions
4. store the data in Google Sheets and/or MariaDB
5. calculate monthly averages
6. display results through the website and future database-driven views

## Practical Philosophy
The project values progress, documentation, and consistency. Even if some data is imperfect early on, the group documents issues, improves the process, and refines the methodology over time.
