import requests
import pandas as pd

"""
###############################################################################

File        : updateJson.py

Date        : Sunday 31st May 2026

Author      : Tom Melton

Description : To collect and clean data from the Give Food API and store it in
              the JSON file foodbankdata.json to be accessed within js.
              For more info see 'Notebooks/FoodbankDataCollection.ipynb'

History     : 31/05/2026 - v1.00

###############################################################################
"""

# Path variables
API = "https://www.givefood.org.uk/api/2/foodbanks/search/?address=Ladywood, Birmingham"
JSON = "foodbankdata.json"

# Get raw data from API
r = requests.get(API)

# Compile into dataframe and remove unnessary columns
df = pd.json_normalize(r.json())
df = df[["id", "name", "address", "postcode", "lat_lng", "needs.needs", "needs.excess"]]

# Split latitude and longitude into seperate columns
df[["latitude", "longitude"]] = df["lat_lng"].str.split(',', expand=True).astype(float)
df = df.drop(columns=["lat_lng"])
df = df[["id", "name", "address", "postcode", "latitude", "longitude", "needs.needs", "needs.excess"]]

# Clean replace \r\n with commas in address
df["address"] = df["address"].str.replace("\r\n", ", ")

# Simplify the names of the 'needs' columns
df = df.rename(columns = {
    "needs.needs": "needs",
    "needs.excess": "excess"
})

# Clean the data in needs and excess
cols = ["needs", "excess"]
for col in cols:
    df[col] = df[col].str.replace("\n", ", ")
    df[col] = df[col].fillna("")
    df[col] = df[col].replace("Unknown", "")

# Save dataframe to the json file
df.to_json(JSON, orient="records", index=False, indent=4)