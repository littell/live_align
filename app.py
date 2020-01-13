from flask import Flask, request, render_template
import json
import os
import base64
from collections import defaultdict
import moviepy.editor as mp
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM

app = Flask(__name__)

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/testSave', methods=["POST"])
def test_save():
    img_data = request.form.get("imgData")
    img_data = img_data.split(",")[1].strip()
    print("png size", len(img_data))

    image = base64.urlsafe_b64decode(img_data.encode('utf-8'))
    with open("test.png", "wb") as fout:
        fout.write(image)

    #frame = cv2.imread("test.png")
    #height, width, layers = frame.shape
    #print(height, width, layers)

    #fourcc = cv2.VideoWriter_fourcc(*'mp4v') # Be sure to use lower case
    #video = cv2.VideoWriter("project.mp4", fourcc, 24.0, (width, height))
    #video.write(frame)

    #cv2.destroyAllWindows()
    #video.release()

    img = ['test.png' ]

    clips = [mp.ImageClip(m).set_duration(2) for m in img]

    concat_clip = mp.concatenate_videoclips(clips, method="compose")
    concat_clip.write_videofile("test.mp4", fps=24)
    
    return json.dumps({ "success": True, "msg": "" })

@app.route('/svgSave', methods=["POST"])
def svg_save():
    img_data = request.form.get("imgData")
    print("svg size", len(img_data))

    with open("temp.svg", "w", encoding="utf-8") as tout:
        tout.write(img_data)

    drawing = svg2rlg("temp.svg")
    renderPM.drawToFile(drawing, "temp.png", fmt="PNG")

    return json.dumps({ "success": True, "msg": "" })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')