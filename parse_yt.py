import xml.etree.ElementTree as ET

tree = ET.parse('feed.xml')
root = tree.getroot()
ns = {'atom': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015'}

for entry in root.findall('atom:entry', ns)[:5]:
    title = entry.find('atom:title', ns).text
    video_id = entry.find('yt:videoId', ns).text
    print(f"Title: {title}")
    print(f"Video ID: {video_id}")
