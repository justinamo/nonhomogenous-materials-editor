import numpy as np
import cv2, cairosvg, image_processor, math, svgpathtools
from EnhancedPath import *
from bottle import route, run, response, request, static_file

plate_path = "plate.jpg"

@route('/plate', method="PUT")
def plate():
    response.set_header('Access-Control-Allow-Origin', '*')
    request.files['plate'].save("plate_raw.jpg", overwrite=True)
    processed = image_processor.process_plate("plate_raw.jpg")
    cv2.imwrite("plate.jpg", processed)
    return "Hello World!"

@route('/plate', method="OPTIONS")
def plate():
    response.set_header('Access-Control-Allow-Origin', '*')
    response.set_header('Access-Control-Allow-Methods', 'PUT')
    response.set_header('Access-Control-Allow-Headers', 'access-control-allow-origin')
    return "Hello World!"

@route('/svg', method="GET")
def svg():
    response.set_header('Access-Control-Allow-Origin', '*')
    return "Hello World!"

@route('/svg', method="PUT")
def svg():
    request.files['svg'].save("output.svg", overwrite=True)

    paths, viewbox = read_svg("output.svg")
    consolidate_to_grouped(paths).write_svg(filename="consolidated_paths.svg", viewbox=viewbox)

    for_client = open("consolidated_paths.svg", mode="rb") 
    response.set_header('Access-Control-Allow-Origin', '*')
    return for_client

@route('/svg', method="OPTIONS")
def svg():
    response.set_header('Access-Control-Allow-Origin', '*')
    response.set_header('Access-Control-Allow-Methods', 'PUT')
    response.set_header('Access-Control-Allow-Headers', 'access-control-allow-origin')
    return "Hello World!"

@route('/intersection', method="OPTIONS")
def intersection():
    response.set_header('Access-Control-Allow-Origin', '*')
    response.set_header('Access-Control-Allow-Methods', 'PUT')
    response.set_header('Access-Control-Allow-Headers', 'access-control-allow-origin')
    return "Hello World!"

@route('/intersection', method="PUT")
def intersection(): 
    svgStartXIn = float(request.forms["svgStartX"])
    svgStartYIn = float(request.forms["svgStartY"])
    svgWidthIn = float(request.forms["svgWidth"])
    svgHeightIn = float(request.forms["svgHeight"])
    plateWidthIn = float(request.forms["plateWidth"])
    plateHeightIn = float(request.forms["plateHeight"])

    plate = cv2.imread(plate_path)[:, :, 0] == 255  # want grayscale
    plateWidthPx = plate.shape[1]
    plateHeightPx = plate.shape[0]

    svgWidthPx = math.floor(plateWidthPx * svgWidthIn / plateWidthIn)
    svgHeightPx = math.floor(plateHeightPx * svgHeightIn / plateHeightIn)

    cairosvg.svg2png(url="output.svg", 
            write_to="for_comparison.png", 
            output_width=svgWidthPx, 
            output_height=svgHeightPx)

    raw_svg_png = cv2.imread("for_comparison.png", cv2.IMREAD_UNCHANGED)
    svg_png = raw_svg_png[:, :, 3] == 0
    interWPx = min(svgWidthPx, plateWidthPx)
    interHPx = min(svgHeightPx, plateHeightPx)
    plate_size_svg_png = np.ones_like(plate)

    svg_x = math.floor(svgStartXIn * plateWidthPx / plateWidthIn) 
    svg_y = math.floor(svgStartYIn * plateHeightPx / plateHeightIn) 

    if svg_y < 0 and svg_x < 0:
        plate_size_svg_png[0:interHPx+svg_y, 0:interWPx+svg_x] = svg_png[-svg_y:interHPx, -svg_x:interWPx]
    elif svg_y >= 0 and svg_x < 0: 
        plate_size_svg_png[svg_y:interHPx, 0:interWPx+svg_x] = svg_png[0:interHPx-svg_y, -svg_x:interWPx]
    elif svg_y < 0 and svg_x >= 0: 
        plate_size_svg_png[0:interHPx+svg_y, svg_x:interWPx] = svg_png[-svg_y:interHPx, 0:interWPx-svg_x]
    elif svg_y >= 0 and svg_x >= 0: 
        plate_size_svg_png[svg_y:interHPx, svg_x:interWPx] = svg_png[0:interHPx-svg_y, 0:interWPx-svg_x]

    intersection = image_processor.find_intersection(plate_size_svg_png, plate)

    inter_rgba = np.dstack((intersection, np.sum(intersection, axis = 2)))
    cv2.imwrite("intersection.png", inter_rgba)

    img = cv2.imread("intersection.png")[:, :, 2] == 0
    img = img.astype(np.uint8)
    contours, hierarchy = cv2.findContours(img, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    img = cv2.drawContours(img, contours[1:], -1, (0, 255, 0), thickness=25)
    img_inv = np.logical_not(img)
    img = image_processor.to_rgb(img)
    img[:, :, 2] = 255
    img = img_inv.reshape((img_inv.shape[0], img_inv.shape[1], 1)) * img

    img_rgba = np.dstack((img, np.sum(img, axis = 2)))
    cv2.imwrite("intersection_thickened.png", img_rgba)

    intersection_png = open("intersection_thickened.png", mode="rb")

    response.set_header('Access-Control-Allow-Origin', '*')
    return intersection_png


run(host='localhost', port=8080, debug=True)
