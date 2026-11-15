# Amazon Music playlist to Spotify

Tested with Python 3.13.12 on macOS 27 on Safari.

With a closed API, no export function, and a song naming system different to Spotify's, Amazon Music makes it difficult to share music/playlists with friends. This tool for techincal users allows you to bridge that gap, breaking the process up into three parts:

1. **Grab** the track list from the Amazon Music web player queue using your web browswer javascript constole (you paste it in).
2. **Clean** and export the data into a CSV of track name, artist and track length.
3. **Create** the Spotify playlist. Each track is searched for using the Spotify API, the right version is picked using a list of conditions, and you get a file to review before anything is created.

```
grab data/
├── grab track list.js                     1. run in the browser console
├── grab track list (unstable network).js*
└── data/
    └── clean track list.ipynb             2. messy track list.txt -> track_list.csv
create playlist/
└── create_playlist.ipynb                  3. track_list.csv -> Spotify playlist
```
**altneratively, use this file if you have a slow network connection*

## Setup (once)

### 1. Create a Spotify app

1. Go to the [Spotify developer dashboard](https://developer.spotify.com/dashboard) and create an app called "create playlist".
2. In the app's settings, add this **Redirect URI** exactly: `http://127.0.0.1:8888/callback` and an **App description** of your choice.
3. Note the app's **Client ID** [```SPOTIPY_CLIENT_ID```] and **Client secret** [```SPOTIPY_CLIENT_SECRET```] (click *View client secret*).

### 2. Install the Python packages

The notebooks expect a virtual environment at `create playlist/.venv`, where ```PATH TO REPOSITORIES FOLDER``` is the location of the downloaded folder, ```create playlist```:

```sh
cd "PATH TO REPOSITORIES FOLDER"
python3 -m venv .venv
.venv/bin/pip install -r ../requirements.txt
```

`requirements.txt` in the top-level folder lists every package the notebooks need.

In VS Code, open each notebook and choose this `.venv` with **Select Kernel** at the top right.

### 3. Add your Spotify credentials

Create a file named `.env` in the `create playlist` folder:

```
SPOTIPY_CLIENT_ID=your_client_id
SPOTIPY_CLIENT_SECRET=your_client_secret
```

Don't use quotes aren't IDs.

> **WARNING: DO NOT SHARE THIS ```.env``` FILE**

## Usage

### 1. Grab the track list from Amazon Music

1. Open the playlist in the Amazon Music web player and click play, then pause and then then open the queue (in the bottom right corner), so the tracks are rendered in the queue.
2. Open and copy the script, `grab data/grab track list.js`---or `grab data/grab track list (unstable network).js` if you have a slow network connection---and set `TITLE` on line 2 to the **exact name of the first track in the queue**. The script uses it to find the Queue on the page.
3. Open the developer/javascript console---Safari (macOS): **Cmd+Option+C** , Chrome (Windows): **Ctrl+Shift+J**---paste the whole script and press Enter. Chrome may ask you to type `allow pasting` first.
4. The script scrolls through the list and saves a file, **`messy track list.txt`**, to your downloads folder. It also copies the full file to your clipboard. Allow the download if Chrome asks.

If tracks are missing on a slow connection, use `grab track list (unstable network).js` instead. It waits for each part of the list to load.

Move `messy track list.txt` into `grab data/data/`. To save straight into that folder and replace an older copy, you need to enable the **Ask where to save each file** in your browsers download settings.

### 2. Clean it into a CSV

Open `grab data/data/clean track list.ipynb` and run all cells. It writes:

- `structured_duplicates.csv`: every row from the raw text, including repeats.
- `track_list.csv`: one row per track, with `trackname`, `artistname` and `trackduration` in milliseconds.

### 3. Create the Spotify playlist

Open `create playlist/create_playlist.ipynb`. Run the cells **one at a time** from the top with **Shift+Enter**. Don't use *Run All*: it would create the playlist without stopping for your review.

1. **Settings:** set `PLAYLIST_NAME`. The playlist is private unless you set `PUBLIC = True`.
2. Run the cells down to **Log in**. The first time, your browser opens a Spotify page asking you to allow the app.
3. **Option A** searches Spotify for each track and writes `matched.csv`.
4. Review `matched.csv` (see below). If you edit it and manually fix the uncrertain tracks, run **Option B** since it skips corrective steps in Option A.
5. Run **Create the playlist**. It prints the link to your new playlist.

Each run cell prints how many Spotify requests it made.

## Reviewing `matched.csv`

Every track gets a **match label**, and the least certain rows are listed first:

| Label | Meaning |
|---|---|
| `exact` | Same artist, same full title |
| `title` | Same song, but the title is written differently, e.g. a remaster or *feat.* credits |
| `version` | Spotify's title adds words like *live*, *remix* or *demo* |
| `artist` | Right artist, different title |
| `guess` | The artist didn't match. Check these |

`length_diff` is Spotify's length minus Amazon's, e.g. `+2s`. Within about 5 seconds it's almost certainly the same recording, even if the label says `version`. A big difference usually means a different version.

To fix a row, paste the correct song's ```uri``` (in Spotify: **Right-Click the song --> Share --> Copy Song Link**) into its `uri` column within ```matched.csv```: ```https://open.spotify.com/track/uri?si=SHARE_IDENTIFIER```. To leave a track out, just delete its row. Then run **Option B** and **Create the playlist**.

>**WARNING:** *Running Option B and then Option A will overwrite anything you have manually added to the file and thus will be deleted. But you can run Option A, correct specific row ```uri```s, then safely run Option B.* 

## Notes

- **Rate limits:** Spotify limits how many requests an app can make. Search results are saved in `search_cache.json` as they come in, so if Spotify stops you partway, running again continues where it left off instead of starting over. Delete that file to search everything again.
- **Each run of "Create the playlist" makes a new playlist,** even with the same name, but doesnt overwrite the previous playlist.
- **Files the notebooks create** stay on your computer: `messy track list.txt`, the CSVs, `search_cache.json`, `not_found.csv`, `.env` and `.spotify_token_cache`, which holds your Spotify login. Don't commit them.
