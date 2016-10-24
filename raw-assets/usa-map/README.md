Builds "usa.svg", which includes all states and congressional districts, plus
labels.

# Running

1. Run `./download-input.sh` to populate the `input/` directory with map data.
2. Run `./generate.sh` to build `../../assets/maps/usa.svg`.

(This is in two steps because we expect to iterate often over the second step
and rarely over the first.)
