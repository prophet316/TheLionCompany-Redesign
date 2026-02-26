import urllib.request
import xml.etree.ElementTree as ET

url = "https://www.youtube.com/feeds/videos.xml?channel_id=UCEy6IknxFCGag4UBVGn4wWg"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req)
    xml_data = response.read()
    root = ET.fromstring(xml_data)
    
    # Namespace dictionary for Atom feed
    ns = {'atom': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015'}
    
    print("Latest Videos:")
    for entry in root.findall('atom:entry', ns)[:5]:
        title = entry.find('atom:title', ns).text
        video_id = entry.find('yt:videoId', ns).text
        print(f"Title: {title}")
        print(f"Video ID: {video_id}")
        print("---")
except Exception as e:
    print(f"Error: {e}")
