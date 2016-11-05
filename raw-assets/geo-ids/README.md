ap-id-to-geo-id.tsv is a mapping from "reporting unit ID" (which AP produces)
to GEOID (which is part of TIGER subcounty data). Luckily, AP gives a "name"
for all its reporting units. Even more luckily, most names match with TIGER
names.

Steps to produce the TSV:

1. Run `./download.sh` to download all the TIGER data we need. (It downloads
   shapefiles, but we only care about the DBF data alongside the shapes.)
2. Make sure there's AP-produced data in `../../data/reportingUnit.json`.
3. Run `./index.js`. It'll read all the IDs from both and attempt to merge.
4. Watch the warnings. If there's a geo that's missing an AP ID, that's okay.
   If there's an AP ID that's missing a geo, that's a serious problem. Fiddle
   with our "normalize" functions to make things match up -- the console
   warnings should give all the information you need.
