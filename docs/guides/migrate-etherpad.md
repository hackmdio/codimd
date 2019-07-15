Pad migration guide from etherpad-lite
===

The goal of this migration is to do a "dumb" import from all the pads in Etherpad, to notes in
CodiMD. In particular, the url locations of the pads in Etherpad will be lost. Furthermore, any
metadata in Etherpad, such as revisions, author data and also formatted text will not be migrated
to CodiMD (only the plain text contents).

Note that this guide is not really meant as a support guide. I migrated my own Etherpad to CodiMD,
and it turned out to be quite easy in my opinion. In this guide I share my experience. Stuff may
require some creativity to work properly in your case. When I wrote this guide, I was using
[Etherpad 1.7.0] and [CodiMD 1.2.1]. Good luck!

[Etherpad 1.7.0]: https://github.com/ether/etherpad-lite/tree/1.7.0
[CodiMD 1.2.1]: https://github.com/hackmdio/codimd/tree/1.2.1

## 0. Requirements

- `curl`
- running Etherpad server
- running CodiMD server
- [codimd-cli]

[codimd-cli]: https://github.com/hackmdio/codimd-cli/blob/master/bin/codimd

## 1. Retrieve the list of pads

First, compose a list of all the pads that you want to have migrated from your Etherpad. Other than
the admin interface, Etherpad does not have a dedicated function to dump a list of all the pads.
However, the Etherpad wiki explains how to list all the pads by [talking directly to the
database][howtolistallpads].

You will end up with a file containing a pad name on each line:

```
date-ideas
groceries
london
weddingchecklist
(...)
```

[howtolistallpads]: https://github.com/ether/etherpad-lite/wiki/How-to-list-all-pads/49701ecdcbe07aea7ad27ffa23aed0d99c2e17db

## 2. Run the migration

Download [codimd-cli] and put the script in the same directory as the file containing the pad names.
Add to this directory the file listed below, I called it `migrate-etherpad.sh`. Modify at least the
configuration settings `ETHERPAD_SERVER` and `CODIMD_SERVER`.

```shell
#!/bin/sh

# migrate-etherpad.sh
#
# Description: Migrate pads from etherpad to codimd
# Author: Daan Sprenkels <hello@dsprenkels.com>

# This script uses the codimd command line script[1] to import a list of pads from 
# [1]: https://github.com/hackmdio/codimd-cli/blob/master/bin/codimd

# The base url to where etherpad is hosted
ETHERPAD_SERVER="https://etherpad.example.com"

# The base url where codimd is hosted
CODIMD_SERVER="https://codimd.example.com"

# Write a list of pads and the urls which they were migrated to
REDIRECTS_FILE="redirects.txt"


# Fail if not called correctly
if (( $# != 1 )); then
    echo "Usage: $0 PAD_NAMES_FILE"
    exit 2
fi

# Do the migration
for PAD_NAME in $1; do
    # Download the pad
    PAD_FILE="$(mktemp)"
    curl "$ETHERPAD_SERVER/p/$PAD_NAME/export/txt" >"$PAD_FILE"
    
    # Import the pad into codimd
    OUTPUT="$(./codimd import "$PAD_FILE")"
    echo "$PAD_NAME -> $OUTPUT" >>"$REDIRECTS_FILE"
done
```

Call this file like this:

```shell
./migrate-etherpad.sh pad_names.txt
```

This will download all the pads in `pad_names.txt` and put them on CodiMD. They will get assigned
random ids, so you won't be able to find them. The script will save the mappings to a file though
(in my case `redirects.txt`). You can use this file to redirect your users when they visit your
etherpad using a `301 Permanent Redirect` status code (see the next section).

## 3. Setup redirects (optional)

I got a `redirects.txt` file that looked a bit like this:

```
date-ideas -> Found. Redirecting to https://codimd.example.com/mPt0KfiKSBOTQ3mNcdfn
groceries -> Found. Redirecting to https://codimd.example.com/UukqgwLfhYyUUtARlcJ2_y
london -> Found. Redirecting to https://codimd.example.com/_d3wa-BE8t4Swv5w7O2_9R
weddingchecklist -> Found. Redirecting to https://codimd.example.com/XcQGqlBjl0u40wfT0N8TzQ
(...)
```

Using some `sed` magic, I changed it to an nginx config snippet:

```
location = /p/date-ideas {
    return 301 https://codimd.example.com/mPt0M1KfiKSBOTQ3mNcdfn;
}
location = /p/groceries {
    return 301 https://codimd.example.com/UukqgwLfhYyUUtARlcJ2_y;
}
location = /p/london {
    return 301 https://codimd.example.com/_d3wa-BE8t4Swv5w7O2_9R;
}
location = /p/weddingchecklist {
    return 301 https://codimd.example.com/XcQGqlBjl0u40wfT0N8TzQ;
}
```

I put this file into my `etherpad.example.com` nginx config, such that all the users would be
redirected accordingly.
