import sys, re, json

def parse_playlist(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()

    data_match = re.search(r'var ytInitialData = (\{.*?\});</script>', html)
    if not data_match:
        print(f"Error parsing {file_path}")
        return

    try:
        data = json.loads(data_match.group(1))
        
        try:
            playlist_title = data['metadata']['playlistMetadataRenderer']['title']
        except:
            playlist_title = "Unknown Playlist"
            
        print(f"=== PLAYLIST: {playlist_title} ===")
        
        items = data['contents']['twoColumnBrowseResultsRenderer']['tabs'][0]['tabRenderer']['content']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][0]['playlistVideoListRenderer']['contents']
        
        for item in items:
            if 'playlistVideoRenderer' in item:
                vid = item['playlistVideoRenderer']['videoId']
                title = item['playlistVideoRenderer']['title']['runs'][0]['text']
                print(f"{vid}:::{title}")
                
    except Exception as e:
        print(f"Failed to parse {file_path}: {e}")

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        parse_playlist(arg)
