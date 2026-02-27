import sys, re

def generate_playlist_html(input_file, output_file):
    html = ""
    current_playlist_html = ""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for line in lines:
        line = line.strip()
        if line.startswith("=== PLAYLIST:"):
            # Close previous block if exists
            if current_playlist_html:
                current_playlist_html += "                </div>\n\n"
                html += current_playlist_html
                
            title = line.replace("=== PLAYLIST: ", "").replace(" ===", "")
            current_playlist_html = f'                <h3 class="mb-6 mt-6 pt-6 border-top">{title.upper()}</h3>\n'
            current_playlist_html += '                <div class="grid-3">\n'
            
        elif ":::" in line:
            vid, vtitle = line.split(":::", 1)
            # Skip the table saw video if present accidentally!
            if "Table Saw Outfeed" in vtitle:
                continue
                
            # Clean up the title string to make it visually cleaner, stripping repetitive channel prefix handling
            vtitle_clean = vtitle.replace("The Lion Company - ", "").replace("The Lion Company: ", "").replace("THE LION COMPANY : ", "").replace("THE LION COMPANY: ", "").replace("The Lion Company | ", "").replace("The Lion Company ", "")
            
            card = f'''                    <a href="#" data-video-id="{vid}" class="media-card bordered-card block video-trigger">
                        <div class="media-image bg-darker" style="background-image: url('https://img.youtube.com/vi/{vid}/hqdefault.jpg'); background-size: cover; background-position: center;">
                        </div>
                        <div class="media-info">
                            <span class="text-gold text-sm tracking-wide">TEACHING</span>
                            <h4 class="mt-2 text-white" style="text-transform: none;">{vtitle_clean}</h4>
                        </div>
                    </a>
'''
            current_playlist_html += card

    if current_playlist_html:
        current_playlist_html += "                </div>\n"
        html += current_playlist_html
        
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)
        
if __name__ == "__main__":
    generate_playlist_html(sys.argv[1], sys.argv[2])
